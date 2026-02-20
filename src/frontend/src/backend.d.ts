import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export class ExternalBlob {
    getBytes(): Promise<Uint8Array<ArrayBuffer>>;
    getDirectURL(): string;
    static fromURL(url: string): ExternalBlob;
    static fromBytes(blob: Uint8Array<ArrayBuffer>): ExternalBlob;
    withUploadProgress(onProgress: (percentage: number) => void): ExternalBlob;
}
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
export interface NotificationRecord {
    bookingId: bigint;
    notificationType: NotificationType;
    recipient: Principal;
    deliveryStatus: DeliveryStatus;
    timestamp: Time;
}
export interface Booking {
    id: bigint;
    status: BookingStatus;
    customer: Principal;
    cancellationReason?: string;
    completed: boolean;
    timestamp: Time;
    serviceId: bigint;
    lastReminderSent?: Time;
    timeSlot: string;
    salonId: Principal;
}
export interface Review {
    customer: Principal;
    comment: string;
    timestamp: Time;
    rating: bigint;
    photo?: ExternalBlob;
}
export interface UserProfile {
    userType: string;
    name: string;
    profilePhoto?: ExternalBlob;
    phoneNumber: string;
}
export enum BookingStatus {
    cancelled = "cancelled",
    pending = "pending",
    confirmed = "confirmed"
}
export enum DeliveryStatus {
    pending = "pending",
    delivered = "delivered",
    failed = "failed"
}
export enum NotificationType {
    bookingConfirmed = "bookingConfirmed",
    bookingReminder = "bookingReminder",
    bookingCancelled = "bookingCancelled"
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
    cancelBooking(bookingId: bigint, reason: string): Promise<void>;
    checkPendingBookingsForReminders(): Promise<Array<[Principal, bigint]>>;
    confirmBooking(bookingId: bigint): Promise<void>;
    createNotification(recipient: Principal, notificationType: NotificationType, bookingId: bigint): Promise<bigint>;
    createOrUpdateSalon(name: string, address: string, contactNumber: string, openingHours: string): Promise<void>;
    getAllSalons(): Promise<Array<Salon>>;
    getBooking(bookingId: bigint): Promise<Booking | null>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getCustomerBookings(): Promise<Array<Booking>>;
    getNotificationsForUser(user: Principal): Promise<Array<NotificationRecord>>;
    getSalon(salonId: Principal): Promise<Salon | null>;
    getSalonBookings(): Promise<Array<Booking>>;
    getSalonReviews(salonId: Principal): Promise<Array<Review>>;
    getSalonServices(salonId: Principal): Promise<Array<Service>>;
    getTimeSlots(salonId: Principal): Promise<Array<string>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    markBookingComplete(bookingId: bigint): Promise<void>;
    setTimeSlots(timeSlots: Array<string>): Promise<void>;
    submitReview(salonId: Principal, rating: bigint, comment: string, photo: ExternalBlob | null): Promise<void>;
    updateNotificationStatus(notificationId: bigint, status: DeliveryStatus): Promise<boolean>;
    updateService(serviceId: bigint, name: string, price: bigint): Promise<void>;
    updateUserProfile(name: string, phoneNumber: string): Promise<void>;
    uploadProfilePhoto(blobRef: ExternalBlob): Promise<void>;
}
