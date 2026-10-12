export interface UserSshKey {
  id: string;
  name: string;
  value: string;
  created_at: string;
  updated_at: string;
}

export interface UserSshKeyListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: UserSshKey[];
}

export interface UserSshKeyOption {
  id: string;
  name: string;
}

export type UserSshKeyPayload = Pick<UserSshKey, "name" | "value">;
