export interface UserProfile {
  id: string;
  tagline: string;
  description: string;
  profile_photo: string;
  user_id: string;
  cover_photo: string;
  created_at: string;
  updated_at: string;
}

export interface CurrentOrgSummary {
  id: string;
  name: string;
  slug: string;
  status: string;
}

export interface CurrentUser {
  id: string;
  first_name: string;
  last_name: string;
  username: string;
  phone_code: string;
  phone_number: string;
  groups: number[];
  groups_objects: string[];
  staff_number: string;
  is_admin: string;
  email: string;
  profile: UserProfile;
  user_type: "CUSTOMER" | string;
  current_organization: CurrentOrgSummary | null;
  branch: string | null;
  business: string | null;
}
