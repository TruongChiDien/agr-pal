/**
 * Status enums for the Agricultural ERP System
 */

// Booking workflow statuses
export enum BookingStatus {
  New = "NEW",
  InProgress = "IN_PROGRESS",
  Blocked = "BLOCKED",
  Completed = "COMPLETED",
  Canceled = "CANCELED",
}

// Booking payment tracking
export enum PaymentStatus {
  PendingBill = "PENDING_BILL",
  AddedBill = "ADDED_BILL",
  FullyPaid = "FULLY_PAID",
}

// Daily machine worker payment tracking (for payroll)
export enum JobPaymentStatus {
  PendingPayroll = "PENDING_PAYROLL",
  AddedPayroll = "ADDED_PAYROLL",
  FullyPaid = "FULLY_PAID",
}

// Bill statuses
export enum BillStatus {
  Open = "OPEN",
  PartialPaid = "PARTIAL_PAID",
  Completed = "COMPLETED",
}

// Payroll statuses
export enum PayrollStatus {
  Open = "OPEN",
  PartialPaid = "PARTIAL_PAID",
  Completed = "COMPLETED",
}

// Machine availability
export enum MachineStatus {
  Available = "AVAILABLE",
  InUse = "IN_USE",
  Maintenance = "MAINTENANCE",
}

// Payment methods
export enum PaymentMethod {
  Cash = "CASH",
  BankTransfer = "BANK_TRANSFER",
}

// Advance payment statuses
export enum AdvanceStatus {
  Unprocessed = "UNPROCESSED",
  Processed = "PROCESSED",
}

// Generic status variants for badge styling
export type StatusVariant =
  | "new"
  | "in-progress"
  | "completed"
  | "blocked"
  | "canceled"
  | "pending"
  | "partial"
  | "paid"
  | "open"
  | "available"
  | "in-use"
  | "maintenance";
