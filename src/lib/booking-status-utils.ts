"use client";

import { checkBookingIncompleteJobs } from "@/actions/bookings";
import { BookingStatus } from "@/types/enums";

export interface BookingStatusUpdateOptions {
  bookingId: string;
  currentStatus: string;
  newStatus: string;
  onNeedConfirmation: (incompleteJobCount: number) => void;
  onProceedWithoutJobs: () => Promise<void>;
}

/**
 * Handles booking status updates with incomplete job checking.
 * When changing to COMPLETED status, checks if there are incomplete jobs
 * and prompts for confirmation.
 * 
 * @returns true if update can proceed directly, false if confirmation needed
 */
export async function handleBookingStatusUpdate({
  bookingId,
  currentStatus,
  newStatus,
  onNeedConfirmation,
  onProceedWithoutJobs,
}: BookingStatusUpdateOptions): Promise<boolean> {
  // If changing to COMPLETED, check for incomplete jobs
  if (newStatus === BookingStatus.Completed && currentStatus !== BookingStatus.Completed) {
    const result = await checkBookingIncompleteJobs(bookingId);
    
    if (result.success && result.data.hasIncompleteJobs) {
      // Need user confirmation
      onNeedConfirmation(result.data.jobCount);
      return false;
    }
  }

  // No confirmation needed, proceed with update
  await onProceedWithoutJobs();
  return true;
}
