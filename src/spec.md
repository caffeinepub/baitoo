# Specification

## Summary
**Goal:** Enable GPS-based salon discovery with location management and booking time notice.

**Planned changes:**
- Add latitude and longitude fields to salon data model
- Allow admin users to set and update salon GPS coordinates via admin panel
- Request customer location permission on salon discovery page
- Calculate and display distance from customer to each salon
- Sort salons by nearest first when location is available
- Update page heading dynamically based on location permission ("Nearby You" vs "Salons in Faizabad")
- Add notice below booking button reminding customers to arrive 10 minutes early

**User-visible outcome:** Customers can see nearby salons sorted by distance with "X.X km away" labels when location permission is granted. Admins can manage salon coordinates. A booking reminder notice is displayed on the booking page.
