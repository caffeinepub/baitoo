import Map "mo:core/Map";
import Array "mo:core/Array";
import Nat "mo:core/Nat";
import Iter "mo:core/Iter";
import Text "mo:core/Text";
import Bool "mo:core/Bool";
import Order "mo:core/Order";
import Time "mo:core/Time";
import Runtime "mo:core/Runtime";
import Principal "mo:core/Principal";

import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";
import MixinStorage "blob-storage/Mixin";
import Storage "blob-storage/Storage";
import Migration "migration";

(with migration = Migration.run)
actor {
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);
  include MixinStorage();

  public type UserProfile = {
    phoneNumber : Text;
    name : Text;
    userType : Text;
    profilePhoto : ?Storage.ExternalBlob;
  };

  type Service = {
    id : Nat;
    name : Text;
    price : Nat;
  };

  module Service {
    public func compare(s1 : Service, s2 : Service) : Order.Order {
      Nat.compare(s1.id, s2.id);
    };
  };

  type Salon = {
    id : Principal;
    name : Text;
    address : Text;
    contactNumber : Text;
    openingHours : Text;
    services : [Service];
    timeSlots : [Text];
    latitude : ?Float;
    longitude : ?Float;
  };

  module Salon {
    public func compare(s1 : Salon, s2 : Salon) : Order.Order {
      Text.compare(s1.name, s2.name);
    };
  };

  public type BookingStatus = {
    #pending;
    #confirmed;
    #cancelled;
  };

  type Booking = {
    id : Nat;
    customer : Principal;
    salonId : Principal;
    serviceId : Nat;
    timeSlot : Text;
    completed : Bool;
    timestamp : Time.Time;
    status : BookingStatus;
    cancellationReason : ?Text;
    lastReminderSent : ?Time.Time;
  };

  type Review = {
    customer : Principal;
    rating : Nat;
    comment : Text;
    timestamp : Time.Time;
    photo : ?Storage.ExternalBlob;
  };

  public type NotificationType = {
    #bookingReminder;
    #bookingConfirmed;
    #bookingCancelled;
  };

  public type DeliveryStatus = {
    #pending;
    #delivered;
    #failed;
  };

  public type NotificationRecord = {
    recipient : Principal;
    notificationType : NotificationType;
    bookingId : Nat;
    timestamp : Time.Time;
    deliveryStatus : DeliveryStatus;
  };

  let userProfiles = Map.empty<Principal, UserProfile>();
  let salons = Map.empty<Principal, Salon>();
  let bookings = Map.empty<Nat, Booking>();
  let reviews = Map.empty<Principal, [Review]>();
  let notifications = Map.empty<Nat, NotificationRecord>();

  var nextBookingId = 1;
  var nextServiceId = 1;
  var nextNotificationId = 1;

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func updateUserProfile(name : Text, phoneNumber : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update profiles");
    };

    let existingProfile = switch (userProfiles.get(caller)) {
      case (null) { Runtime.trap("User profile does not exist") };
      case (?p) { p };
    };

    let updatedProfile = {
      existingProfile with
      name;
      phoneNumber;
    };

    userProfiles.add(caller, updatedProfile);
  };

  public shared ({ caller }) func uploadProfilePhoto(blobRef : Storage.ExternalBlob) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can upload profile photos");
    };

    let existingProfile = switch (userProfiles.get(caller)) {
      case (null) { Runtime.trap("User profile does not exist") };
      case (?p) { p };
    };

    let updatedProfile = {
      existingProfile with
      profilePhoto = ?blobRef;
    };

    userProfiles.add(caller, updatedProfile);
  };

  public query ({ caller }) func getSalon(salonId : Principal) : async ?Salon {
    salons.get(salonId);
  };

  public shared ({ caller }) func createOrUpdateSalon(name : Text, address : Text, contactNumber : Text, openingHours : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create or update salons");
    };
    let existingSalon = switch (salons.get(caller)) {
      case (null) {
        {
          id = caller;
          name = "";
          address = "";
          contactNumber = "";
          openingHours = "";
          services = [];
          timeSlots = [];
          latitude = null;
          longitude = null;
        };
      };
      case (?salon) { salon };
    };
    let updatedSalon = {
      existingSalon with
      name;
      address;
      contactNumber;
      openingHours;
    };
    salons.add(caller, updatedSalon);
  };

  public query ({ caller }) func getSalonServices(salonId : Principal) : async [Service] {
    switch (salons.get(salonId)) {
      case (?salon) { salon.services };
      case (null) { [] };
    };
  };

  public shared ({ caller }) func addService(name : Text, price : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can add services");
    };
    let salon = switch (salons.get(caller)) {
      case (null) { Runtime.trap("Salon does not exist") };
      case (?s) { s };
    };
    let newService = {
      id = nextServiceId;
      name;
      price;
    };
    nextServiceId += 1;
    let updatedServices = salon.services.concat([newService]);
    let updatedSalon = { salon with services = updatedServices };
    salons.add(caller, updatedSalon);
  };

  public shared ({ caller }) func updateService(serviceId : Nat, name : Text, price : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update services");
    };
    let salon = switch (salons.get(caller)) {
      case (null) { Runtime.trap("Salon does not exist") };
      case (?s) { s };
    };
    let updatedServices = salon.services.map(
      func(s : Service) : Service {
        if (s.id == serviceId) {
          { s with name; price };
        } else {
          s;
        };
      }
    );
    let updatedSalon = { salon with services = updatedServices };
    salons.add(caller, updatedSalon);
  };

  public shared ({ caller }) func setTimeSlots(timeSlots : [Text]) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can set time slots");
    };
    let salon = switch (salons.get(caller)) {
      case (null) { Runtime.trap("Salon does not exist") };
      case (?s) { s };
    };
    let updatedSalon = { salon with timeSlots };
    salons.add(caller, updatedSalon);
  };

  public query ({ caller }) func getTimeSlots(salonId : Principal) : async [Text] {
    switch (salons.get(salonId)) {
      case (?salon) { salon.timeSlots };
      case (null) { [] };
    };
  };

  public shared ({ caller }) func bookAppointment(salonId : Principal, serviceId : Nat, timeSlot : Text) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can book appointments");
    };
    let salon = switch (salons.get(salonId)) {
      case (null) { Runtime.trap("Salon does not exist") };
      case (?s) { s };
    };
    let serviceExists = switch (salon.services.find(func(s) { s.id == serviceId })) {
      case (null) { false };
      case (_) { true };
    };
    if (not serviceExists) {
      Runtime.trap("Service does not exist");
    };
    let newBooking = {
      id = nextBookingId;
      customer = caller;
      salonId;
      serviceId;
      timeSlot;
      completed = false;
      timestamp = Time.now();
      status = #pending;
      cancellationReason = null;
      lastReminderSent = null;
    };
    bookings.add(nextBookingId, newBooking);
    nextBookingId += 1;
    newBooking.id;
  };

  public shared ({ caller }) func markBookingComplete(bookingId : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can mark bookings as complete");
    };
    let booking = switch (bookings.get(bookingId)) {
      case (null) { Runtime.trap("Booking does not exist") };
      case (?b) { b };
    };
    if (booking.salonId != caller) {
      Runtime.trap("Unauthorized: Only the salon owner can mark this booking as complete");
    };
    let updatedBooking = { booking with completed = true };
    bookings.add(bookingId, updatedBooking);
  };

  public shared ({ caller }) func confirmBooking(bookingId : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can confirm bookings");
    };
    let booking = switch (bookings.get(bookingId)) {
      case (null) { Runtime.trap("Booking does not exist") };
      case (?b) { b };
    };
    if (booking.salonId != caller) {
      Runtime.trap("Unauthorized: Only the salon owner can confirm bookings");
    };
    if (booking.status != #pending) {
      Runtime.trap("Booking can only be confirmed from pending state");
    };
    let updatedBooking = { booking with status = #confirmed };
    bookings.add(bookingId, updatedBooking);
  };

  public shared ({ caller }) func cancelBooking(bookingId : Nat, reason : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can cancel bookings");
    };
    let booking = switch (bookings.get(bookingId)) {
      case (null) { Runtime.trap("Booking does not exist") };
      case (?b) { b };
    };
    if (booking.salonId != caller) {
      Runtime.trap("Unauthorized: Only the salon owner can cancel bookings");
    };
    if (booking.status == #cancelled) {
      Runtime.trap("Booking is already cancelled");
    };
    let updatedBooking = {
      booking with
      status = #cancelled;
      cancellationReason = ?reason;
    };
    bookings.add(bookingId, updatedBooking);
  };

  public query ({ caller }) func getSalonBookings() : async [Booking] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view salon bookings");
    };
    bookings.values().toArray().filter(func(b : Booking) : Bool { b.salonId == caller });
  };

  public query ({ caller }) func getCustomerBookings() : async [Booking] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view their bookings");
    };
    bookings.values().toArray().filter(func(b : Booking) : Bool { b.customer == caller });
  };

  public query ({ caller }) func getBooking(bookingId : Nat) : async ?Booking {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view booking details");
    };
    let booking = bookings.get(bookingId);
    switch (booking) {
      case (?b) {
        if (b.customer != caller and b.salonId != caller and not AccessControl.isAdmin(accessControlState, caller)) {
          Runtime.trap("Unauthorized: Can only view your own bookings");
        };
        booking;
      };
      case (null) { null };
    };
  };

  public query ({ caller }) func getAllSalons() : async [Salon] {
    salons.values().toArray().sort();
  };

  public shared ({ caller }) func submitReview(salonId : Principal, rating : Nat, comment : Text, photo : ?Storage.ExternalBlob) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can submit reviews");
    };

    let hasCompletedBooking = bookings.values().toArray().find(
      func(b : Booking) : Bool {
        b.customer == caller and b.salonId == salonId and b.completed;
      }
    );

    switch (hasCompletedBooking) {
      case (null) {
        Runtime.trap("Unauthorized: Can only review salons where you have completed bookings");
      };
      case (?_) {
        if (rating < 1 or rating > 5) {
          Runtime.trap("Invalid rating: Must be between 1 and 5");
        };
        let review = {
          customer = caller;
          rating;
          comment;
          timestamp = Time.now();
          photo;
        };
        let existingReviews = switch (reviews.get(salonId)) {
          case (null) { [] };
          case (?r) { r };
        };
        let updatedReviews = existingReviews.concat([review]);
        reviews.add(salonId, updatedReviews);
      };
    };
  };

  public query ({ caller }) func getSalonReviews(salonId : Principal) : async [Review] {
    switch (reviews.get(salonId)) {
      case (null) { [] };
      case (?r) { r };
    };
  };

  public query ({ caller }) func adminGetAllSalons() : async [Salon] {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can view all salons");
    };
    salons.values().toArray().sort();
  };

  public query ({ caller }) func adminGetAllUsers() : async [(Principal, UserProfile)] {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can view all users");
    };
    userProfiles.entries().toArray();
  };

  public query ({ caller }) func adminGetAllBookings() : async [Booking] {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can view all bookings");
    };
    bookings.values().toArray();
  };

  public shared ({ caller }) func adminDeleteSalon(salonId : Principal) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can delete salons");
    };
    salons.remove(salonId);
  };

  public shared ({ caller }) func adminDeleteUser(userId : Principal) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can delete users");
    };
    userProfiles.remove(userId);
  };

  public query ({ caller }) func getNotificationsForUser(user : Principal) : async [NotificationRecord] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view notifications");
    };
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own notifications");
    };
    notifications.values().toArray().filter(func(n) { n.recipient == user });
  };

  public shared ({ caller }) func updateNotificationStatus(notificationId : Nat, status : DeliveryStatus) : async Bool {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update notification status");
    };
    switch (notifications.get(notificationId)) {
      case (null) { false };
      case (?notification) {
        if (notification.recipient != caller and not AccessControl.isAdmin(accessControlState, caller)) {
          Runtime.trap("Unauthorized: Can only update your own notifications");
        };
        let updatedNotification = { notification with deliveryStatus = status };
        notifications.add(notificationId, updatedNotification);
        true;
      };
    };
  };

  public shared ({ caller }) func checkPendingBookingsForReminders() : async [(Principal, Nat)] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can check for pending bookings");
    };

    let now = Time.now();
    let thresholdTime = 300_000_000_000;

    let bookingsNeedingReminders = bookings.values().toArray().filter(
      func(b : Booking) : Bool {
        b.salonId == caller and b.status == #pending and (now - b.timestamp) > thresholdTime and b.lastReminderSent == null;
      }
    );

    for (booking in bookingsNeedingReminders.values()) {
      let updatedBooking = { booking with lastReminderSent = ?now };
      bookings.add(booking.id, updatedBooking);
    };

    let mappedBookings = bookingsNeedingReminders.map(
      func(b) { (b.salonId, b.id) }
    );
    mappedBookings;
  };

  public shared ({ caller }) func createNotification(recipient : Principal, notificationType : NotificationType, bookingId : Nat) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create notifications");
    };

    let booking = switch (bookings.get(bookingId)) {
      case (null) { Runtime.trap("Booking does not exist") };
      case (?b) { b };
    };

    if (booking.salonId != caller and booking.customer != caller and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only create notifications for your own bookings");
    };

    let notificationRecord = {
      recipient;
      notificationType;
      bookingId;
      timestamp = Time.now();
      deliveryStatus = #pending;
    };
    notifications.add(nextNotificationId, notificationRecord);
    nextNotificationId += 1;
    nextNotificationId - 1;
  };

  // New admin-only function to update salon location
  public shared ({ caller }) func updateSalonLocation(salonId : Principal, latitude : Float, longitude : Float) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can update salon location");
    };

    switch (salons.get(salonId)) {
      case (null) {
        Runtime.trap("Salon does not exist");
      };
      case (?salon) {
        let updatedSalon = {
          salon with
          latitude = ?latitude;
          longitude = ?longitude;
        };
        salons.add(salonId, updatedSalon);
      };
    };
  };
};
