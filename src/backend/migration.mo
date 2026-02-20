import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Nat "mo:core/Nat";
import Storage "blob-storage/Storage";

module {
  type OldUserProfile = {
    phoneNumber : Text;
    name : Text;
    userType : Text;
  };

  type OldReview = {
    customer : Principal;
    rating : Nat;
    comment : Text;
    timestamp : Int;
  };

  type OldActor = {
    userProfiles : Map.Map<Principal, OldUserProfile>;
    reviews : Map.Map<Principal, [OldReview]>;
  };

  type NewUserProfile = {
    phoneNumber : Text;
    name : Text;
    userType : Text;
    profilePhoto : ?Storage.ExternalBlob;
  };

  type NewReview = {
    customer : Principal;
    rating : Nat;
    comment : Text;
    timestamp : Int;
    photo : ?Storage.ExternalBlob;
  };

  type NewActor = {
    userProfiles : Map.Map<Principal, NewUserProfile>;
    reviews : Map.Map<Principal, [NewReview]>;
  };

  public func run(old : OldActor) : NewActor {
    let newUserProfiles = old.userProfiles.map<Principal, OldUserProfile, NewUserProfile>(
      func(_id, oldProfile) {
        { oldProfile with profilePhoto = null };
      }
    );

    let newReviews = old.reviews.map<Principal, [OldReview], [NewReview]>(
      func(_p, oldReviews) {
        oldReviews.map(
          func(oldReview) {
            { oldReview with photo = null };
          }
        );
      }
    );

    { old with userProfiles = newUserProfiles; reviews = newReviews };
  };
};
