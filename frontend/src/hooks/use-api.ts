
// src/hooks/use-api.ts
import {
  useMutation,
  UseMutationOptions,
  useQuery,
  useQueryClient,
  UseQueryOptions,
} from "@tanstack/react-query";
import axios, { AxiosError, AxiosInstance } from "axios";
import toast from "react-hot-toast";
import { useSubscriptionUiStore } from "@/stores/subscription-ui-store";
import { renderToast } from "./toast-renderer";

declare module "axios" {
  interface AxiosRequestConfig {
    /** Skip the interceptor's success/error toasts (e.g. for polling). */
    silent?: boolean;
  }
}

/* ================================
   AXIOS INSTANCE
================================ */

const axiosInstance: AxiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api",
});

/* ================================
   REQUEST INTERCEPTOR
================================ */

axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem("authToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/* ================================
   HELPER: Format text professionally
================================ */

const formatText = (text: string): string => {
  let formatted = text.replace(/[_-]+/g, " ");
  formatted = formatted
    .split(" ")
    .map((word) => {
      if (word.length === 0) return word;
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(" ");

  const specialCases: Record<string, string> = {
    Id: "ID",
    Url: "URL",
    Api: "API",
    Uuid: "UUID",
  };

  for (const [key, value] of Object.entries(specialCases)) {
    formatted = formatted.replace(new RegExp(`\\b${key}\\b`, "g"), value);
  }

  return formatted;
};

/* ================================
   HELPER: Get success message
================================ */

const getSuccessMessage = (method: string, url: string): string => {
  const method_lower = method.toLowerCase();

  if (url.includes("/token/") && method_lower === "post") return "Login successful";

  const urlParts = url.split("/").filter((part) => part && !part.includes("?"));
  let resource = "";

  if (urlParts.length > 0) {
    
    const lastPart = urlParts[urlParts.length - 1];
    const isUuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        lastPart,
      );
    if (!isUuid) {
      resource = formatText(lastPart);
    } else if (urlParts.length > 1) {
      resource = formatText(urlParts[urlParts.length - 2]);
    }
  }

  const actionMap: Record<string, string> = {
    post: "created",
    put: "updated",
    patch: "updated",
    delete: "deleted",
  };

  const action = actionMap[method_lower];
  if (resource && action) return `${resource} ${action} successfully`;

  const fallbackMap: Record<string, string> = {
    post: "Created successfully",
    put: "Updated successfully",
    patch: "Updated successfully",
    delete: "Deleted successfully",
  };

  return fallbackMap[method_lower] || "Action completed successfully";
};

/* ================================
   HELPER: Parse Django Error Responses
================================ */

interface ParsedError {
  field: string;
  message: string;
}

const parseDjangoErrors = (error: any): ParsedError[] => {
  const data = error?.response?.data;
  const errors: ParsedError[] = [];

  if (!data) {
    errors.push({
      field: "error",
      message: error?.message || "Something went wrong",
    });
    return errors;
  }

  if (typeof data === "object" && "detail" in data) {
    errors.push({ field: "error", message: String(data.detail) });
    return errors;
  }

  if (typeof data === "object" && "non_field_errors" in data) {
    const nonFieldErrors = Array.isArray(data.non_field_errors)
      ? data.non_field_errors
      : [String(data.non_field_errors)];
    nonFieldErrors.forEach((errMsg: string) => {
      errors.push({ field: "error", message: errMsg });
    });
  }

  if (typeof data === "object" && data.errors && Array.isArray(data.errors)) {
    data.errors.forEach((err: any) => {
      errors.push({
        field: err.attr || "field",
        message: err.detail || err.message || "Invalid value",
      });
    });
    return errors;
  }

  if (typeof data === "object") {
    for (const [key, value] of Object.entries(data)) {
      if (Array.isArray(value)) {
        value.forEach((errMsg: string) =>
          errors.push({ field: key, message: errMsg }),
        );
      } else if (typeof value === "string") {
        errors.push({ field: key, message: value });
      } else if (typeof value === "object" && value !== null) {
        const nestedErrors = parseDjangoErrors({ response: { data: value } });
        errors.push(...nestedErrors);
      }
    }
  }

  if (typeof data === "string") {
    errors.push({ field: "error", message: data });
  }

  if (errors.length === 0) {
    errors.push({ field: "error", message: "An unexpected error occurred" });
  }

  return errors;
};

/* ================================
   HELPER: Show toasts
================================ */

const toastStyle = (type: "success" | "error" | "loading") => {
  const base = {
    backdropFilter: "blur(10px)",
    borderRadius: "12px",
    padding: "10px 16px",
    fontFamily: "var(--font-jost)",
    color: "#ffffff",
    minWidth: "260px",
    maxWidth: "420px",
  };

  const variants = {
    success: {
      background: "rgba(34, 197, 94, 0.45)",
      border: "1px solid rgba(34, 197, 94, 0.3)",
    },
    error: {
      background: "rgba(239, 68, 68, 0.45)",
      border: "1px solid rgba(239, 68, 68, 0.3)",
    },
    loading: {
      background: "rgba(128, 128, 128, 0.45)",
      border: "1px solid rgba(255, 255, 255, 0.1)",
    },
  };

  return { ...base, ...variants[type] };
};

const showSuccessToast = (message: string) => {
  toast((t) => renderToast(t, message, "success"), {
    duration: 3000,
    position: "top-center",
    style: toastStyle("success"),
  });
};

const showErrorToasts = (errors: ParsedError[]) => {
  errors.forEach((error) => {
    let message = error.message;
    if (message.length > 0)
      message = message.charAt(0).toUpperCase() + message.slice(1);
    if (
      !message.endsWith(".") &&
      !message.endsWith("!") &&
      !message.endsWith("?")
    )
      message += ".";

    toast((t) => renderToast(t, message, "error"), {
      duration: 5000,
      position: "top-center",
      style: toastStyle("error"),
    });
  });
};

/* ================================
   RESPONSE INTERCEPTOR
================================ */

axiosInstance.interceptors.response.use(
  (response) => {
    if (
      !response.config.silent &&
      response.config.method &&
      response.config.method.toLowerCase() !== "get"
    ) {
      toast.success("Request successful ✅");
    }
    return response;
  },
  (error: AxiosError<any>) => {
    const status = error.response?.status;
    const method = error.config?.method?.toLowerCase();

    if (!error.config?.silent && method && method !== "get") {
      const parsedErrors = parseDjangoErrors(error);
      showErrorToasts(parsedErrors);
    }

    // Expired subscription: read-only mode. Refresh status and prompt to renew.
    if (
      status === 402 &&
      error.response?.data?.errors?.[0]?.code === "subscription_expired"
    ) {
      useSubscriptionUiStore.getState().notifyExpired();
    }

    if (status === 401) {
      localStorage.removeItem("authToken");
      if (window.location.pathname !== "/") {
        window.location.href = "/";
      }
    }

    return Promise.reject(error);
  },
);

/* ================================
   BASE API HOOK
================================ */

export const useApi = () => {
  const request = async <T>(
    url: string,
    method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH" = "GET",
    data?: unknown,
  ) => {
    const { data: response } = await axiosInstance({
      url,
      method,
      data,
    });
    return response as T;
  };

  return { request, axiosInstance };
};

/* ================================
   QUERY HOOK
================================ */

type ApiQueryOptions<T, TSelected = T> = Omit<
  UseQueryOptions<T, AxiosError, TSelected, readonly unknown[]>,
  "queryKey" | "queryFn"
> & {
  queryKey?: readonly unknown[];
};

export const useApiQuery = <T, TSelected = T>(url: string, options?: ApiQueryOptions<T, TSelected>) => {
  const { request } = useApi();
  const key = options?.queryKey ?? [url];

  return useQuery<T, AxiosError, TSelected>({
    queryKey: key,
    queryFn: () => request<T>(url),
    ...options,
  });
};

/* ================================
   MUTATION HOOK - FIXED
================================ */

type ApiMutationOptions<TData, TVariables> = {
  method: "POST" | "PUT" | "PATCH" | "DELETE";
  url: string | ((variables: TVariables) => string);
  invalidateQueries?: (string | string[])[];
} & Omit<UseMutationOptions<TData, AxiosError, TVariables>, "mutationFn">;

export const useApiMutation = <TData, TVariables = unknown>({
  method,
  url,
  invalidateQueries,
  ...options
}: ApiMutationOptions<TData, TVariables>) => {
  const { request } = useApi();
  const queryClient = useQueryClient();

  return useMutation<TData, AxiosError, TVariables>({
    mutationFn: async (variables: TVariables) => {
      const finalUrl = typeof url === "function" ? url(variables) : url;
      return request<TData>(finalUrl, method, variables);
    },
    onSuccess: (data, variables, context, meta) => {
      if (invalidateQueries) {
        invalidateQueries.forEach((queryKey) => {
          queryClient.invalidateQueries({
            queryKey: Array.isArray(queryKey) ? queryKey : [queryKey],
          });
        });
      }
      options?.onSuccess?.(data, variables, context, meta);
    },
    onError: (error: AxiosError, variables, context, meta) => {
      options?.onError?.(error, variables, context, meta);
    },
    ...options,
  });
};

export { axiosInstance, formatText, getSuccessMessage, parseDjangoErrors };
