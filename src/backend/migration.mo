import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Principal "mo:core/Principal";
import Iter "mo:core/Iter";
import Time "mo:core/Time";
import Storage "blob-storage/Storage";

module {
  public type OldUserProfile = {
    phoneNumber : Text;
    name : Text;
    userType : Text;
    profilePhoto : ?Storage.ExternalBlob;
  };

  public type OldService = {
    id : Nat;
    name : Text;
    price : Nat;
  };

  public type OldSalon = {
    id : Principal;
    name : Text;
    address : Text;
    contactNumber : Text;
    openingHours : Text;
    services : [OldService];
    timeSlots : [Text];
  };

  public type BookingStatus = { #pending; #confirmed; #cancelled };

  public type OldBooking = {
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

  public type OldReview = {
    customer : Principal;
    rating : Nat;
    comment : Text;
    timestamp : Time.Time;
    photo : ?Storage.ExternalBlob;
  };

  public type NotificationType = { #bookingReminder; #bookingConfirmed; #bookingCancelled };
  public type DeliveryStatus = { #pending; #delivered; #failed };

  public type OldNotificationRecord = {
    recipient : Principal;
    notificationType : NotificationType;
    bookingId : Nat;
    timestamp : Time.Time;
    deliveryStatus : DeliveryStatus;
  };

  public type OldActor = {
    userProfiles : Map.Map<Principal, OldUserProfile>;
    salons : Map.Map<Principal, OldSalon>;
    bookings : Map.Map<Nat, OldBooking>;
    reviews : Map.Map<Principal, [OldReview]>;
    notifications : Map.Map<Nat, OldNotificationRecord>;
    nextBookingId : Nat;
    nextServiceId : Nat;
    nextNotificationId : Nat;
  };

  public type NewSalon = {
    id : Principal;
    name : Text;
    address : Text;
    contactNumber : Text;
    openingHours : Text;
    services : [OldService];
    timeSlots : [Text];
    latitude : ?Float;
    longitude : ?Float;
  };

  public type NewActor = {
    userProfiles : Map.Map<Principal, OldUserProfile>;
    salons : Map.Map<Principal, NewSalon>;
    bookings : Map.Map<Nat, OldBooking>;
    reviews : Map.Map<Principal, [OldReview]>;
    notifications : Map.Map<Nat, OldNotificationRecord>;
    nextBookingId : Nat;
    nextServiceId : Nat;
    nextNotificationId : Nat;
  };

  public func run(old : OldActor) : NewActor {
    let newSalons = old.salons.map<Principal, OldSalon, NewSalon>(
      func(_id, oldSalon) {
        {
          id = oldSalon.id;
          name = oldSalon.name;
          address = oldSalon.address;
          contactNumber = oldSalon.contactNumber;
          openingHours = oldSalon.openingHours;
          services = oldSalon.services;
          timeSlots = oldSalon.timeSlots;
          latitude = null;
          longitude = null;
        };
      }
    );
    {
      old with
      salons = newSalons;
    };
  };
};
