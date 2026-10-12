// src/components/ui/alert-toast.tsx
"use client";

import { AlertCircle, CheckCircle, XCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useEffect, useState } from "react";

type AlertType = "success" | "error" | "info";

interface AlertToastProps {
  message: string;
  type: AlertType;
  onClose: () => void;
}

export function AlertToast({ message, type, onClose }: AlertToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const icons = {
    success: <CheckCircle className="h-4 w-4 text-green-600" />,
    error: <XCircle className="h-4 w-4 text-red-600" />,
    info: <AlertCircle className="h-4 w-4 text-blue-600" />,
  };

  const colors = {
    success: "border-green-200 bg-green-50",
    error: "border-red-200 bg-red-50",
    info: "border-blue-200 bg-blue-50",
  };

  return (
    <div className="fixed top-4 right-4 z-50 w-96 animate-in slide-in-from-top-2">
      <Alert className={`${colors[type]} border`}>
        {icons[type]}
        <AlertTitle className="capitalize">{type}</AlertTitle>
        <AlertDescription>{message}</AlertDescription>
      </Alert>
    </div>
  );
}

// Create a context for global alerts
interface AlertContextType {
  showAlert: (message: string, type: AlertType) => void;
}

import React from "react";

const AlertContext = React.createContext<AlertContextType | undefined>(
  undefined,
);

export function AlertProvider({ children }: { children: React.ReactNode }) {
  const [alerts, setAlerts] = useState<
    Array<{ id: number; message: string; type: AlertType }>
  >([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const showAlert = (message: string, type: AlertType) => {
    const id = Date.now();
    setAlerts((prev) => [...prev, { id, message, type }]);
  };

  const removeAlert = (id: number) => {
    setAlerts((prev) => prev.filter((alert) => alert.id !== id));
  };

  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <AlertContext.Provider value={{ showAlert }}>
      {children}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {alerts.map((alert) => (
          <AlertToast
            key={alert.id}
            message={alert.message}
            type={alert.type}
            onClose={() => removeAlert(alert.id)}
          />
        ))}
      </div>
    </AlertContext.Provider>
  );
}

export function useAlert() {
  const context = React.useContext(AlertContext);
  if (!context) {
    throw new Error("useAlert must be used within AlertProvider");
  }
  return context;
}
