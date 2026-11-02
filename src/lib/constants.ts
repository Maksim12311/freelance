import type {
  ApplicationStatus,
  CollaborationStatus,
  ReportStatus,
  RequestStatus,
  VerificationStatus,
  WorkEligibilityStatus,
  WorkMode,
} from "@/types/database";

export const APP_NAME = "StudentPro";
export const TAGLINE = "Students Helping Students.";
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const DEFAULT_LOCATION = "Vienna";
export const DEFAULT_CURRENCY = "EUR" as const;
export const DOCUMENT_RETENTION_DAYS = Number(
  process.env.DOCUMENT_RETENTION_DAYS ?? 90,
);

export const NAV_LINKS = [
  { href: "/requests", label: "Find Requests" },
  { href: "/students", label: "Find Students" },
  { href: "/how-it-works", label: "How It Works" },
] as const;

export const AUTH_LINKS = {
  login: "/login",
  signup: "/signup",
  resetPassword: "/reset-password",
} as const;

export const PROTECTED_ROUTES = [
  "/dashboard",
  "/messages",
  "/settings",
  "/verify-student",
  "/requests/new",
  "/admin",
] as const;

export const VERIFICATION_STATUS_LABELS: Record<VerificationStatus, string> = {
  not_verified: "Not verified",
  pending_review: "Pending review",
  verified: "Verified",
  rejected: "Rejected",
  expired: "Expired",
};

export const WORK_ELIGIBILITY_STATUS_LABELS: Record<
  WorkEligibilityStatus,
  string
> = {
  not_assessed: "Not assessed",
  information_required: "Information required",
  reviewed: "Reviewed",
  restricted: "Restricted",
};

export const WORK_MODE_LABELS: Record<WorkMode, string> = {
  remote: "Remote",
  in_person: "In person",
  hybrid: "Hybrid",
};

export const REQUEST_STATUS_LABELS: Record<RequestStatus, string> = {
  open: "Open",
  in_progress: "In progress",
  closed: "Closed",
  cancelled: "Cancelled",
};

export const APPLICATION_STATUS_LABELS: Record<ApplicationStatus, string> = {
  sent: "Sent",
  viewed: "Viewed",
  accepted: "Accepted",
  declined: "Declined",
  withdrawn: "Withdrawn",
};

export const COLLABORATION_STATUS_LABELS: Record<CollaborationStatus, string> =
  {
    pending_confirmation: "Pending confirmation",
    confirmed: "Confirmed",
    completed: "Completed",
    cancelled: "Cancelled",
  };

export const REPORT_STATUS_LABELS: Record<ReportStatus, string> = {
  open: "Open",
  under_review: "Under review",
  resolved: "Resolved",
  dismissed: "Dismissed",
  escalated: "Escalated",
};

export const WORK_MODES = Object.keys(WORK_MODE_LABELS) as WorkMode[];

export const POPULAR_CATEGORY_SLUGS = [
  "photography",
  "video-editing",
  "graphic-design",
  "tutoring",
  "technology",
  "moving-help",
  "language-support",
  "everyday-help",
] as const;

export const MAX_REQUEST_IMAGES = 5;
export const MAX_IMAGE_UPLOAD_BYTES = 5 * 1024 * 1024; // 5 MB
export const MAX_VERIFICATION_DOCUMENT_BYTES = 10 * 1024 * 1024; // 10 MB

export const ALLOWED_IMAGE_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export const ALLOWED_VERIFICATION_MIME_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
] as const;

/** Alias used by verification server actions. */
export const ALLOWED_VERIFICATION_MIME = ALLOWED_VERIFICATION_MIME_TYPES;
