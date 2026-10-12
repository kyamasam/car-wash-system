"use client";

import { useRef } from "react";
import { LoginCard } from "@/components/auth/login-card";

interface LoginModalProps {
  onClose?: () => void;
}

export const LoginModal = ({ onClose }: LoginModalProps) => {
  const modalRef = useRef<HTMLDivElement>(null);

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
      onClose?.();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={handleBackdropClick}
    >
      <div ref={modalRef} className="w-full max-w-md">
        <LoginCard onSuccess={onClose} />
      </div>
    </div>
  );
};
