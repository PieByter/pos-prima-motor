"use client";

import { useEffect, useLayoutEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X, AlertCircle, CheckCircle, Info } from "lucide-react";

export type ToastType = "success" | "error" | "info";

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastProps {
  toast: Toast;
  onClose: (id: string) => void;
}

function ToastItem({ toast, onClose }: ToastProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (toast.duration) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(() => onClose(toast.id), 300);
      }, toast.duration);
      return () => clearTimeout(timer);
    }
  }, [toast.duration, toast.id, onClose]);

  const bgColor =
    toast.type === "success"
      ? "#16a34a"
      : toast.type === "error"
        ? "#dc2626"
        : "#2563eb";

  const Icon =
    toast.type === "success"
      ? CheckCircle
      : toast.type === "error"
        ? AlertCircle
        : Info;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "12px",
        paddingLeft: "16px",
        paddingRight: "16px",
        paddingTop: "12px",
        paddingBottom: "12px",
        borderRadius: "8px",
        boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
        color: "white",
        backgroundColor: bgColor,
        transition: "all 300ms ease-in-out",
        minWidth: "320px",
        maxWidth: "400px",
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? "translateX(0)" : "translateX(500px)",
        pointerEvents: isVisible ? "auto" : "none",
      }}
    >
      <Icon style={{ width: "20px", height: "20px", flexShrink: 0 }} />
      <p
        style={{
          fontSize: "14px",
          fontWeight: 500,
          flex: 1,
          margin: 0,
          wordBreak: "break-word",
        }}
      >
        {toast.message}
      </p>
      <button
        onClick={() => {
          setIsVisible(false);
          setTimeout(() => onClose(toast.id), 300);
        }}
        style={{
          background: "none",
          border: "none",
          color: "white",
          cursor: "pointer",
          padding: "4px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = "#d1d5db";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = "white";
        }}
        aria-label="Close toast"
      >
        <X style={{ width: "16px", height: "16px" }} />
      </button>
    </div>
  );
}

interface ToastContainerProps {
  toasts: Toast[];
  onRemoveToast: (id: string) => void;
}

function ToastContainerContent({ toasts, onRemoveToast }: ToastContainerProps) {
  return (
    <div
      style={{
        position: "fixed",
        bottom: "16px",
        right: "16px",
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        gap: "8px",
        pointerEvents: "none",
      }}
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          style={{
            pointerEvents: "auto",
          }}
        >
          <ToastItem toast={toast} onClose={onRemoveToast} />
        </div>
      ))}
    </div>
  );
}

export function ToastContainer({ toasts, onRemoveToast }: ToastContainerProps) {
  const [mounted, setMounted] = useState(false);

  useLayoutEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  // Don't render anything until after hydration completes
  if (!mounted) {
    return null;
  }

  return createPortal(
    <ToastContainerContent toasts={toasts} onRemoveToast={onRemoveToast} />,
    document.body,
  );
}

export function useToasts() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = (
    message: string,
    type: ToastType = "info",
    duration = 3000,
  ) => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, message, type, duration }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return { toasts, showToast, removeToast };
}
