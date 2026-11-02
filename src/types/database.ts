export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]
  // Allow plain object literals from app code (e.g. audit metadata).
  | { [key: string]: unknown };

export type VerificationStatus =
  | "not_verified"
  | "pending_review"
  | "verified"
  | "rejected"
  | "expired";

export type WorkEligibilityStatus =
  | "not_assessed"
  | "information_required"
  | "reviewed"
  | "restricted";

export type RequestStatus = "open" | "in_progress" | "closed" | "cancelled";

export type WorkMode = "remote" | "in_person" | "hybrid";

export type ApplicationStatus =
  | "sent"
  | "viewed"
  | "accepted"
  | "declined"
  | "withdrawn";

export type CollaborationStatus =
  | "pending_confirmation"
  | "confirmed"
  | "completed"
  | "cancelled";

export type ReportTargetType =
  | "request"
  | "profile"
  | "message"
  | "review"
  | "application";

export type ReportStatus =
  | "open"
  | "under_review"
  | "resolved"
  | "dismissed"
  | "escalated";

export type NotificationType =
  | "application"
  | "message"
  | "verification"
  | "review"
  | "system"
  | "moderation";

export type VerificationMethod = "university_email" | "enrollment_certificate";

export interface Database {
  public: {
    Tables: {
      universities: {
        Row: {
          id: string;
          name: string;
          short_name: string | null;
          city: string;
          country: string;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          short_name?: string | null;
          city?: string;
          country?: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          short_name?: string | null;
          city?: string;
          country?: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      university_email_domains: {
        Row: {
          id: string;
          university_id: string;
          domain: string;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          university_id: string;
          domain: string;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          university_id?: string;
          domain?: string;
          is_active?: boolean;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "university_email_domains_university_id_fkey";
            columns: ["university_id"];
            isOneToOne: false;
            referencedRelation: "universities";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          id: string;
          first_name: string;
          last_name: string;
          display_name: string;
          email: string;
          university_id: string | null;
          bio: string | null;
          avatar_url: string | null;
          general_location: string | null;
          is_admin: boolean;
          is_suspended: boolean;
          suspension_reason: string | null;
          verification_status: VerificationStatus;
          verified_at: string | null;
          verification_expires_at: string | null;
          work_eligibility_status: WorkEligibilityStatus;
          work_eligibility_notes: string | null;
          availability: string | null;
          profile_completed: boolean;
          notification_email: boolean;
          notification_messages: boolean;
          notification_applications: boolean;
          privacy_show_in_directory: boolean;
          privacy_show_university: boolean;
          completed_collaborations_count: number;
          average_rating: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          first_name: string;
          last_name: string;
          display_name: string;
          email: string;
          university_id?: string | null;
          bio?: string | null;
          avatar_url?: string | null;
          general_location?: string | null;
          is_admin?: boolean;
          is_suspended?: boolean;
          suspension_reason?: string | null;
          verification_status?: VerificationStatus;
          verified_at?: string | null;
          verification_expires_at?: string | null;
          work_eligibility_status?: WorkEligibilityStatus;
          work_eligibility_notes?: string | null;
          availability?: string | null;
          profile_completed?: boolean;
          notification_email?: boolean;
          notification_messages?: boolean;
          notification_applications?: boolean;
          privacy_show_in_directory?: boolean;
          privacy_show_university?: boolean;
          completed_collaborations_count?: number;
          average_rating?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          first_name?: string;
          last_name?: string;
          display_name?: string;
          email?: string;
          university_id?: string | null;
          bio?: string | null;
          avatar_url?: string | null;
          general_location?: string | null;
          is_admin?: boolean;
          is_suspended?: boolean;
          suspension_reason?: string | null;
          verification_status?: VerificationStatus;
          verified_at?: string | null;
          verification_expires_at?: string | null;
          work_eligibility_status?: WorkEligibilityStatus;
          work_eligibility_notes?: string | null;
          availability?: string | null;
          profile_completed?: boolean;
          notification_email?: boolean;
          notification_messages?: boolean;
          notification_applications?: boolean;
          privacy_show_in_directory?: boolean;
          privacy_show_university?: boolean;
          completed_collaborations_count?: number;
          average_rating?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "profiles_university_id_fkey";
            columns: ["university_id"];
            isOneToOne: false;
            referencedRelation: "universities";
            referencedColumns: ["id"];
          },
        ];
      };
      categories: {
        Row: {
          id: string;
          name: string;
          slug: string;
          description: string | null;
          icon: string | null;
          sort_order: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          description?: string | null;
          icon?: string | null;
          sort_order?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          description?: string | null;
          icon?: string | null;
          sort_order?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      skills: {
        Row: {
          id: string;
          category_id: string | null;
          name: string;
          slug: string;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          category_id?: string | null;
          name: string;
          slug: string;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          category_id?: string | null;
          name?: string;
          slug?: string;
          is_active?: boolean;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "skills_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
        ];
      };
      profile_skills: {
        Row: {
          profile_id: string;
          skill_id: string;
          created_at: string;
        };
        Insert: {
          profile_id: string;
          skill_id: string;
          created_at?: string;
        };
        Update: {
          profile_id?: string;
          skill_id?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "profile_skills_profile_id_fkey";
            columns: ["profile_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "profile_skills_skill_id_fkey";
            columns: ["skill_id"];
            isOneToOne: false;
            referencedRelation: "skills";
            referencedColumns: ["id"];
          },
        ];
      };
      student_verifications: {
        Row: {
          id: string;
          profile_id: string;
          method: VerificationMethod;
          status: VerificationStatus;
          university_email: string | null;
          university_email_confirmed_at: string | null;
          document_path: string | null;
          document_mime_type: string | null;
          document_size_bytes: number | null;
          reviewer_id: string | null;
          review_notes: string | null;
          rejection_reason: string | null;
          submitted_at: string;
          reviewed_at: string | null;
          expires_at: string | null;
          document_deleted_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          profile_id: string;
          method: VerificationMethod;
          status?: VerificationStatus;
          university_email?: string | null;
          university_email_confirmed_at?: string | null;
          document_path?: string | null;
          document_mime_type?: string | null;
          document_size_bytes?: number | null;
          reviewer_id?: string | null;
          review_notes?: string | null;
          rejection_reason?: string | null;
          submitted_at?: string;
          reviewed_at?: string | null;
          expires_at?: string | null;
          document_deleted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          profile_id?: string;
          method?: VerificationMethod;
          status?: VerificationStatus;
          university_email?: string | null;
          university_email_confirmed_at?: string | null;
          document_path?: string | null;
          document_mime_type?: string | null;
          document_size_bytes?: number | null;
          reviewer_id?: string | null;
          review_notes?: string | null;
          rejection_reason?: string | null;
          submitted_at?: string;
          reviewed_at?: string | null;
          expires_at?: string | null;
          document_deleted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "student_verifications_profile_id_fkey";
            columns: ["profile_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "student_verifications_reviewer_id_fkey";
            columns: ["reviewer_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      requests: {
        Row: {
          id: string;
          owner_id: string;
          category_id: string;
          title: string;
          description: string;
          suggested_budget_eur: number | null;
          location: string | null;
          work_mode: WorkMode;
          preferred_date: string | null;
          status: RequestStatus;
          preferred_applicant_id: string | null;
          application_count: number;
          is_hidden: boolean;
          closed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          category_id: string;
          title: string;
          description: string;
          suggested_budget_eur?: number | null;
          location?: string | null;
          work_mode?: WorkMode;
          preferred_date?: string | null;
          status?: RequestStatus;
          preferred_applicant_id?: string | null;
          application_count?: number;
          is_hidden?: boolean;
          closed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          owner_id?: string;
          category_id?: string;
          title?: string;
          description?: string;
          suggested_budget_eur?: number | null;
          location?: string | null;
          work_mode?: WorkMode;
          preferred_date?: string | null;
          status?: RequestStatus;
          preferred_applicant_id?: string | null;
          application_count?: number;
          is_hidden?: boolean;
          closed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "requests_owner_id_fkey";
            columns: ["owner_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "requests_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "requests_preferred_applicant_id_fkey";
            columns: ["preferred_applicant_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      request_images: {
        Row: {
          id: string;
          request_id: string;
          storage_path: string;
          mime_type: string;
          size_bytes: number;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          request_id: string;
          storage_path: string;
          mime_type: string;
          size_bytes: number;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          request_id?: string;
          storage_path?: string;
          mime_type?: string;
          size_bytes?: number;
          sort_order?: number;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "request_images_request_id_fkey";
            columns: ["request_id"];
            isOneToOne: false;
            referencedRelation: "requests";
            referencedColumns: ["id"];
          },
        ];
      };
      applications: {
        Row: {
          id: string;
          request_id: string;
          applicant_id: string;
          introduction: string;
          experience: string | null;
          proposed_price_eur: number | null;
          availability: string | null;
          status: ApplicationStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          request_id: string;
          applicant_id: string;
          introduction: string;
          experience?: string | null;
          proposed_price_eur?: number | null;
          availability?: string | null;
          status?: ApplicationStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          request_id?: string;
          applicant_id?: string;
          introduction?: string;
          experience?: string | null;
          proposed_price_eur?: number | null;
          availability?: string | null;
          status?: ApplicationStatus;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "applications_request_id_fkey";
            columns: ["request_id"];
            isOneToOne: false;
            referencedRelation: "requests";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "applications_applicant_id_fkey";
            columns: ["applicant_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      conversations: {
        Row: {
          id: string;
          request_id: string | null;
          created_by: string;
          last_message_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          request_id?: string | null;
          created_by: string;
          last_message_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          request_id?: string | null;
          created_by?: string;
          last_message_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "conversations_request_id_fkey";
            columns: ["request_id"];
            isOneToOne: false;
            referencedRelation: "requests";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "conversations_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      conversation_participants: {
        Row: {
          conversation_id: string;
          profile_id: string;
          last_read_at: string | null;
          joined_at: string;
        };
        Insert: {
          conversation_id: string;
          profile_id: string;
          last_read_at?: string | null;
          joined_at?: string;
        };
        Update: {
          conversation_id?: string;
          profile_id?: string;
          last_read_at?: string | null;
          joined_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "conversation_participants_conversation_id_fkey";
            columns: ["conversation_id"];
            isOneToOne: false;
            referencedRelation: "conversations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "conversation_participants_profile_id_fkey";
            columns: ["profile_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      messages: {
        Row: {
          id: string;
          conversation_id: string;
          sender_id: string;
          body: string;
          is_deleted: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          conversation_id: string;
          sender_id: string;
          body: string;
          is_deleted?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          conversation_id?: string;
          sender_id?: string;
          body?: string;
          is_deleted?: boolean;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey";
            columns: ["conversation_id"];
            isOneToOne: false;
            referencedRelation: "conversations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "messages_sender_id_fkey";
            columns: ["sender_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      saved_requests: {
        Row: {
          profile_id: string;
          request_id: string;
          created_at: string;
        };
        Insert: {
          profile_id: string;
          request_id: string;
          created_at?: string;
        };
        Update: {
          profile_id?: string;
          request_id?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "saved_requests_profile_id_fkey";
            columns: ["profile_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "saved_requests_request_id_fkey";
            columns: ["request_id"];
            isOneToOne: false;
            referencedRelation: "requests";
            referencedColumns: ["id"];
          },
        ];
      };
      collaborations: {
        Row: {
          id: string;
          request_id: string;
          requester_id: string;
          helper_id: string;
          application_id: string | null;
          status: CollaborationStatus;
          requester_confirmed_at: string | null;
          helper_confirmed_at: string | null;
          completed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          request_id: string;
          requester_id: string;
          helper_id: string;
          application_id?: string | null;
          status?: CollaborationStatus;
          requester_confirmed_at?: string | null;
          helper_confirmed_at?: string | null;
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          request_id?: string;
          requester_id?: string;
          helper_id?: string;
          application_id?: string | null;
          status?: CollaborationStatus;
          requester_confirmed_at?: string | null;
          helper_confirmed_at?: string | null;
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "collaborations_request_id_fkey";
            columns: ["request_id"];
            isOneToOne: false;
            referencedRelation: "requests";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "collaborations_requester_id_fkey";
            columns: ["requester_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "collaborations_helper_id_fkey";
            columns: ["helper_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "collaborations_application_id_fkey";
            columns: ["application_id"];
            isOneToOne: false;
            referencedRelation: "applications";
            referencedColumns: ["id"];
          },
        ];
      };
      reviews: {
        Row: {
          id: string;
          collaboration_id: string;
          reviewer_id: string;
          reviewee_id: string;
          communication_rating: number;
          reliability_rating: number;
          overall_rating: number;
          comment: string | null;
          is_hidden: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          collaboration_id: string;
          reviewer_id: string;
          reviewee_id: string;
          communication_rating: number;
          reliability_rating: number;
          overall_rating: number;
          comment?: string | null;
          is_hidden?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          collaboration_id?: string;
          reviewer_id?: string;
          reviewee_id?: string;
          communication_rating?: number;
          reliability_rating?: number;
          overall_rating?: number;
          comment?: string | null;
          is_hidden?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "reviews_collaboration_id_fkey";
            columns: ["collaboration_id"];
            isOneToOne: false;
            referencedRelation: "collaborations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "reviews_reviewer_id_fkey";
            columns: ["reviewer_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "reviews_reviewee_id_fkey";
            columns: ["reviewee_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      reports: {
        Row: {
          id: string;
          reporter_id: string;
          target_type: ReportTargetType;
          target_id: string;
          reason: string;
          details: string | null;
          status: ReportStatus;
          assigned_admin_id: string | null;
          resolution_notes: string | null;
          appeal_text: string | null;
          appeal_submitted_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          reporter_id: string;
          target_type: ReportTargetType;
          target_id: string;
          reason: string;
          details?: string | null;
          status?: ReportStatus;
          assigned_admin_id?: string | null;
          resolution_notes?: string | null;
          appeal_text?: string | null;
          appeal_submitted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          reporter_id?: string;
          target_type?: ReportTargetType;
          target_id?: string;
          reason?: string;
          details?: string | null;
          status?: ReportStatus;
          assigned_admin_id?: string | null;
          resolution_notes?: string | null;
          appeal_text?: string | null;
          appeal_submitted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "reports_reporter_id_fkey";
            columns: ["reporter_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "reports_assigned_admin_id_fkey";
            columns: ["assigned_admin_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      blocked_users: {
        Row: {
          blocker_id: string;
          blocked_id: string;
          reason: string | null;
          created_at: string;
        };
        Insert: {
          blocker_id: string;
          blocked_id: string;
          reason?: string | null;
          created_at?: string;
        };
        Update: {
          blocker_id?: string;
          blocked_id?: string;
          reason?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "blocked_users_blocker_id_fkey";
            columns: ["blocker_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "blocked_users_blocked_id_fkey";
            columns: ["blocked_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      notifications: {
        Row: {
          id: string;
          profile_id: string;
          type: NotificationType;
          title: string;
          body: string;
          link_path: string | null;
          is_read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          profile_id: string;
          type: NotificationType;
          title: string;
          body: string;
          link_path?: string | null;
          is_read?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          profile_id?: string;
          type?: NotificationType;
          title?: string;
          body?: string;
          link_path?: string | null;
          is_read?: boolean;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "notifications_profile_id_fkey";
            columns: ["profile_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      admin_audit_logs: {
        Row: {
          id: string;
          admin_id: string;
          action: string;
          target_type: string | null;
          target_id: string | null;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          admin_id: string;
          action: string;
          target_type?: string | null;
          target_id?: string | null;
          metadata?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          admin_id?: string;
          action?: string;
          target_type?: string | null;
          target_id?: string | null;
          metadata?: Json;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "admin_audit_logs_admin_id_fkey";
            columns: ["admin_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: {
      is_admin: {
        Args: Record<string, never>;
        Returns: boolean;
      };
      is_verified_student: {
        Args: Record<string, never>;
        Returns: boolean;
      };
      is_conversation_participant: {
        Args: { p_conversation_id: string };
        Returns: boolean;
      };
      // App-level RPCs (may be added in later migrations / admin helpers).
      request_account_deletion: {
        Args: Record<string, never>;
        Returns: undefined;
      };
      increment_collaboration_counts: {
        Args: { p_requester: string; p_helper: string };
        Returns: undefined;
      };
    };
    Enums: {
      verification_status: VerificationStatus;
      work_eligibility_status: WorkEligibilityStatus;
      request_status: RequestStatus;
      work_mode: WorkMode;
      application_status: ApplicationStatus;
      collaboration_status: CollaborationStatus;
      report_target_type: ReportTargetType;
      report_status: ReportStatus;
      notification_type: NotificationType;
    };
    CompositeTypes: Record<string, never>;
  };
}

type PublicSchema = Database["public"];

export type Tables<T extends keyof PublicSchema["Tables"]> =
  PublicSchema["Tables"][T]["Row"];

export type TablesInsert<T extends keyof PublicSchema["Tables"]> =
  PublicSchema["Tables"][T]["Insert"];

export type TablesUpdate<T extends keyof PublicSchema["Tables"]> =
  PublicSchema["Tables"][T]["Update"];

export type Enums<T extends keyof PublicSchema["Enums"]> =
  PublicSchema["Enums"][T];

export type Profile = Tables<"profiles">;
export type University = Tables<"universities">;
export type UniversityEmailDomain = Tables<"university_email_domains">;
export type Category = Tables<"categories">;
export type Skill = Tables<"skills">;
export type ProfileSkill = Tables<"profile_skills">;
export type StudentVerification = Tables<"student_verifications">;
export type Request = Tables<"requests">;
/** Alias preferred by data helpers. */
export type RequestRow = Request;
export type RequestImage = Tables<"request_images">;
export type Application = Tables<"applications">;
export type Conversation = Tables<"conversations">;
export type ConversationParticipant = Tables<"conversation_participants">;
export type Message = Tables<"messages">;
export type SavedRequest = Tables<"saved_requests">;
export type Collaboration = Tables<"collaborations">;
export type Review = Tables<"reviews">;
export type Report = Tables<"reports">;
export type BlockedUser = Tables<"blocked_users">;
export type Notification = Tables<"notifications">;
export type AdminAuditLog = Tables<"admin_audit_logs">;
