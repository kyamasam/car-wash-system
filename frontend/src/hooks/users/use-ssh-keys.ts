import { useApiMutation, useApiQuery } from "@/hooks/use-api";
import type {
  UserSshKey,
  UserSshKeyListResponse,
  UserSshKeyOption,
  UserSshKeyPayload,
} from "@/types/users/ssh-key";

function buildSshKeysUrl(page = 1): string {
  const params = new URLSearchParams();
  if (page > 1) params.set("page", String(page));

  const qs = params.toString();
  return qs ? `/users/ssh-keys/?${qs}` : "/users/ssh-keys/";
}

export const useSshKeys = (page = 1) => {
  return useApiQuery<UserSshKeyListResponse>(buildSshKeysUrl(page), {
    queryKey: ["ssh-keys", page],
  });
};

export const useSshKeyOptions = () => {
  return useApiQuery<UserSshKeyOption[]>("/users/ssh-keys/options/", {
    queryKey: ["ssh-key-options"],
  });
};

export const useCreateSshKey = () => {
  return useApiMutation<UserSshKey, UserSshKeyPayload>({
    method: "POST",
    url: "/users/ssh-keys/",
    invalidateQueries: [["ssh-keys"], ["ssh-key-options"]],
  });
};

export const useUpdateSshKey = () => {
  return useApiMutation<UserSshKey, UserSshKeyPayload & { id: string }>({
    method: "PATCH",
    url: ({ id }) => `/users/ssh-keys/${id}/`,
    invalidateQueries: [["ssh-keys"], ["ssh-key-options"]],
  });
};

export const useDeleteSshKey = () => {
  return useApiMutation<void, { id: string }>({
    method: "DELETE",
    url: ({ id }) => `/users/ssh-keys/${id}/`,
    invalidateQueries: [["ssh-keys"], ["ssh-key-options"]],
  });
};
