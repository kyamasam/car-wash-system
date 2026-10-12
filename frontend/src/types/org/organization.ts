export type OrgRole = "OWNER" | "ADMIN" | "VIEWER";
export type OrgStatus = "active" | "suspended" | "trial" | "archived";

export interface Organization {
  id: string;
  name: string;
  slug: string;
  billing_email: string | null;
  tax_id: string | null;
  industry: string | null;
  location: string | null;
  country: string | null;
  settings: Record<string, unknown>;
  status: OrgStatus;
  trial_ends_at: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface OrganizationMember {
  id: string;
  organization: string;
  user: string;
  user_email: string;
  user_name: string;
  role: OrgRole;
  invited_by: string | null;
  invited_by_email: string | null;
  invited_email: string | null;
  is_pending: boolean;
  joined_at: string | null;
  invited_at: string;
  left_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface PendingInvitation {
  id: string;
  token: string;
  role: OrgRole;
  invited_at: string;
  organization_name: string;
  organization_slug: string;
  invited_by_name: string | null;
}

export const ORG_ROLE_LABELS: Record<OrgRole, string> = {
  OWNER: "Owner",
  ADMIN: "Admin",
  VIEWER: "Viewer",
};

export const INVITABLE_ROLES: OrgRole[] = ["OWNER", "ADMIN", "VIEWER"];

export const CHANGEABLE_ROLES: OrgRole[] = ["ADMIN", "VIEWER"];
