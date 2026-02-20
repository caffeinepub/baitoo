import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export type Time = bigint;
export interface Salon {
    id: Principal;
    timeSlots: Array<string>;
    name: string;
    address: string;
    openingHours: string;
    contactNumber: string;
    services: Array<Service>;
}
export interface Service {
    id: bigint;
    name: string;
    price: bigint;
}
export interface Booking {
    id: bigint;
    customer: Principal;
    completed: boolean;
    timestamp: Time;
    serviceId: bigint;
    timeSlot: string;
    salonId: Principal;
}
export interface UserProfile {
    userType: string;
    name: string;
    phoneNumber: string;
}
export interface Review {
    customer: Principal;
    comment: string;
    timestamp: Time;
    rating: bigint;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addService(name: string, price: bigint): Promise<void>;
    adminDeleteSalon(salonId: Principal): Promise<void>;
    adminDeleteUser(userId: Principal): Promise<void>;
    adminGetAllBookings(): Promise<Array<Booking>>;
    adminGetAllSalons(): Promise<Array<Salon>>;
    adminGetAllUsers(): Promise<Array<[Principal, UserProfile]>>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    bookAppointment(salonId: Principal, serviceId: bigint, timeSlot: string): Promise<bigint>;
    createOrUpdateSalon(name: string, address: string, contactNumber: string, openingHours: string): Promise<void>;
    getAllSalons(): Promise<Array<Salon>>;
    getBooking(bookingId: bigint): Promise<Booking | null>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getCustomerBookings(): Promise<Array<Booking>>;
    getSalon(salonId: Principal): Promise<Salon | null>;
    getSalonBookings(): Promise<Array<Booking>>;
    getSalonReviews(salonId: Principal): Promise<Array<Review>>;
    getSalonServices(salonId: Principal): Promise<Array<Service>>;
    getTimeSlots(salonId: Principal): Promise<Array<string>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    markBookingComplete(bookingId: bigint): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    setTimeSlots(timeSlots: Array<string>): Promise<void>;
    submitReview(salonId: Principal, rating: bigint, comment: string): Promise<void>;
    updateService(serviceId: bigint, name: string, price: bigint): Promise<void>;
}
