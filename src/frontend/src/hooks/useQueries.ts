import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import type { UserProfile, Salon, Service, Booking, Review } from '../backend';
import { Principal } from '@dfinity/principal';

// User Profile Hooks
export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();

  const query = useQuery<UserProfile | null>({
    queryKey: ['currentUserProfile'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !actorFetching,
    retry: false,
  });

  return {
    ...query,
    isLoading: actorFetching || query.isLoading,
    isFetched: !!actor && query.isFetched,
  };
}

export function useSaveCallerUserProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor) throw new Error('Actor not available');
      return actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
  });
}

export function useGetUserProfile(userId: Principal | null) {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<UserProfile | null>({
    queryKey: ['userProfile', userId?.toString()],
    queryFn: async () => {
      if (!actor || !userId) return null;
      return actor.getUserProfile(userId);
    },
    enabled: !!actor && !actorFetching && !!userId,
  });
}

// Salon Hooks
export function useGetSalon(salonId: string | undefined) {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<Salon | null>({
    queryKey: ['salon', salonId],
    queryFn: async () => {
      if (!actor || !salonId) return null;
      return actor.getSalon(Principal.fromText(salonId));
    },
    enabled: !!actor && !actorFetching && !!salonId,
  });
}

export function useGetAllSalons() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<Salon[]>({
    queryKey: ['salons'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllSalons();
    },
    enabled: !!actor && !actorFetching,
  });
}

export function useCreateOrUpdateSalon() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { name: string; address: string; contactNumber: string; openingHours: string }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.createOrUpdateSalon(data.name, data.address, data.contactNumber, data.openingHours);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['salon'] });
      queryClient.invalidateQueries({ queryKey: ['salons'] });
    },
  });
}

// Service Hooks
export function useGetSalonServices(salonId: string | undefined) {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<Service[]>({
    queryKey: ['services', salonId],
    queryFn: async () => {
      if (!actor || !salonId) return [];
      return actor.getSalonServices(Principal.fromText(salonId));
    },
    enabled: !!actor && !actorFetching && !!salonId,
  });
}

export function useAddService() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { name: string; price: bigint }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.addService(data.name, data.price);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      queryClient.invalidateQueries({ queryKey: ['salon'] });
    },
  });
}

export function useUpdateService() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { serviceId: bigint; name: string; price: bigint }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateService(data.serviceId, data.name, data.price);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      queryClient.invalidateQueries({ queryKey: ['salon'] });
    },
  });
}

// Time Slot Hooks
export function useGetTimeSlots(salonId: string | undefined) {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<string[]>({
    queryKey: ['timeSlots', salonId],
    queryFn: async () => {
      if (!actor || !salonId) return [];
      return actor.getTimeSlots(Principal.fromText(salonId));
    },
    enabled: !!actor && !actorFetching && !!salonId,
  });
}

export function useSetTimeSlots() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (timeSlots: string[]) => {
      if (!actor) throw new Error('Actor not available');
      return actor.setTimeSlots(timeSlots);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timeSlots'] });
      queryClient.invalidateQueries({ queryKey: ['salon'] });
    },
  });
}

// Booking Hooks
export function useBookAppointment() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { salonId: Principal; serviceId: bigint; timeSlot: string }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.bookAppointment(data.salonId, data.serviceId, data.timeSlot);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
    },
  });
}

export function useGetBooking(bookingId: string | undefined) {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<Booking | null>({
    queryKey: ['booking', bookingId],
    queryFn: async () => {
      if (!actor || !bookingId) return null;
      return actor.getBooking(BigInt(bookingId));
    },
    enabled: !!actor && !actorFetching && !!bookingId,
  });
}

export function useGetCustomerBookings() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<Booking[]>({
    queryKey: ['customerBookings'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getCustomerBookings();
    },
    enabled: !!actor && !actorFetching,
  });
}

export function useGetSalonBookings() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<Booking[]>({
    queryKey: ['salonBookings'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getSalonBookings();
    },
    enabled: !!actor && !actorFetching,
  });
}

export function useMarkBookingComplete() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (bookingId: bigint) => {
      if (!actor) throw new Error('Actor not available');
      return actor.markBookingComplete(bookingId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['salonBookings'] });
      queryClient.invalidateQueries({ queryKey: ['customerBookings'] });
    },
  });
}

// Review Hooks
export function useSubmitReview() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { salonId: Principal; rating: bigint; comment: string }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.submitReview(data.salonId, data.rating, data.comment);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
    },
  });
}

export function useGetSalonReviews(salonId: string | undefined) {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<Review[]>({
    queryKey: ['reviews', salonId],
    queryFn: async () => {
      if (!actor || !salonId) return [];
      return actor.getSalonReviews(Principal.fromText(salonId));
    },
    enabled: !!actor && !actorFetching && !!salonId,
  });
}

// Admin Hooks
export function useIsCallerAdmin() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<boolean>({
    queryKey: ['isAdmin'],
    queryFn: async () => {
      if (!actor) return false;
      return actor.isCallerAdmin();
    },
    enabled: !!actor && !actorFetching,
  });
}

export function useAdminGetAllSalons() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<Salon[]>({
    queryKey: ['adminSalons'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.adminGetAllSalons();
    },
    enabled: !!actor && !actorFetching,
  });
}

export function useAdminGetAllUsers() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<[Principal, UserProfile][]>({
    queryKey: ['adminUsers'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.adminGetAllUsers();
    },
    enabled: !!actor && !actorFetching,
  });
}

export function useAdminDeleteSalon() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (salonId: Principal) => {
      if (!actor) throw new Error('Actor not available');
      return actor.adminDeleteSalon(salonId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminSalons'] });
      queryClient.invalidateQueries({ queryKey: ['salons'] });
    },
  });
}

export function useAdminDeleteUser() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: Principal) => {
      if (!actor) throw new Error('Actor not available');
      return actor.adminDeleteUser(userId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
    },
  });
}
