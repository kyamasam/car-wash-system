// src/hooks/toast-renderer.tsx
import toast from "react-hot-toast";
import { CheckCircle, XCircle, Loader2, X } from "lucide-react";

export const renderToast = (
  t: any,
  message: string,
  type: "success" | "error" | "loading",
) => {
  const icons = {
    success: <CheckCircle size={15} className="text-green-400 shrink-0" />,
    error: <XCircle size={15} className="text-red-400 shrink-0" />,
    loading: (
      <Loader2 size={15} className="text-white/60 shrink-0 animate-spin" />
    ),
  };

  return (
    <div className="flex items-center gap-2 w-full">
      {icons[type]}
      <span className="flex-1 text-sm font-medium text-white leading-snug">
        {message}
      </span>
      {type !== "loading" && (
        <button
          onClick={() => toast.dismiss(t.id)}
          className="shrink-0 ml-1 rounded p-0.5 text-white/40 hover:text-white/80 transition-colors"
          aria-label="Dismiss"
        >
          <X size={12} />
        </button>
      )}
    </div>
  );
};
