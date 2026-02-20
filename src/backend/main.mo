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

actor {
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // User Profile Type
  public type UserProfile = {
    phoneNumber : Text;
    name : Text;
    userType : Text; // "salon_owner" or "customer"
  };

  type Service = {
    id : Nat;
    name : Text;
    price : Nat; // Price in INR (rupees)
  };

  module Service {
    public func compare(s1 : Service, s2 : Service) : Order.Order {
      Nat.compare(s1.id, s2.id);
    };
  };

  type Salon = {
    id : Principal; // Salon owner principal
    name : Text;
    address : Text;
    contactNumber : Text;
    openingHours : Text;
    services : [Service];
    timeSlots : [Text]; // e.g. "10:00 AM", "2:30 PM"
  };

  module Salon {
    public func compare(s1 : Salon, s2 : Salon) : Order.Order {
      Text.compare(s1.name, s2.name);
    };
  };

  type Booking = {
    id : Nat;
    customer : Principal;
    salonId : Principal;
    serviceId : Nat;
    timeSlot : Text;
    completed : Bool;
    timestamp : Time.Time;
  };

  type Review = {
    customer : Principal;
    rating : Nat; // 1-5 stars
    comment : Text;
    timestamp : Time.Time;
  };

  let userProfiles = Map.empty<Principal, UserProfile>();
  let salons = Map.empty<Principal, Salon>();
  let bookings = Map.empty<Nat, Booking>();
  let reviews = Map.empty<Principal, [Review]>();

  var nextBookingId = 1;
  var nextServiceId = 1;

  // User Profile Management
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

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  // Salon Profile Management
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

  // Service Management
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

  // Time Slot Management
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

  // Appointment Booking
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
    };
    bookings.add(nextBookingId, newBooking);
    nextBookingId += 1;
    newBooking.id;
  };

  // Booking Completion
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

  // Bookings Dashboard for Salon Owners
  public query ({ caller }) func getSalonBookings() : async [Booking] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view salon bookings");
    };
    bookings.values().toArray().filter(func(b : Booking) : Bool { b.salonId == caller });
  };

  // Customer Bookings
  public query ({ caller }) func getCustomerBookings() : async [Booking] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view their bookings");
    };
    bookings.values().toArray().filter(func(b : Booking) : Bool { b.customer == caller });
  };

  // Get specific booking details
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

  // Salon Discovery
  public query ({ caller }) func getAllSalons() : async [Salon] {
    salons.values().toArray().sort();
  };

  // Reviews and Ratings
  public shared ({ caller }) func submitReview(salonId : Principal, rating : Nat, comment : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can submit reviews");
    };

    // Verify customer has a completed booking at this salon
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

  // Admin Panel Functions
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
};
