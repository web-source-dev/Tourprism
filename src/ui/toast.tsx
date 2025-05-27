"use client";

import { useState, useEffect, createContext, useContext, ReactNode, useRef } from "react";
import { IoCheckmarkCircle } from "react-icons/io5";
import { IoIosAlert } from "react-icons/io";

// Toast types
export type ToastType = "success" | "error";

// Toast props interface
interface Toast {
  message: string;
  type: ToastType;
  id: string;
}

// Toast context interface
interface ToastContextType {
  showToast: (message: string, type: ToastType) => void;
  hideToast: (id: string) => void;
}

// Create Toast Context
const ToastContext = createContext<ToastContextType | undefined>(undefined);

// Toast Provider component
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  // Track active toast timeouts
  const toastTimeoutsRef = useRef<Record<string, NodeJS.Timeout>>({});

  // Function to show a toast
  const showToast = (message: string, type: ToastType) => {
    // Clear all existing toasts and timeouts before showing a new one
    Object.values(toastTimeoutsRef.current).forEach(clearTimeout);
    toastTimeoutsRef.current = {};
    setToasts([]);  // Clear all existing toasts
    
    const id = Math.random().toString(36).substring(2, 9);
    
    // Add new toast to state
    setToasts([{ message, type, id }]);
    
    // Create a timeout to auto-hide toast after 4 seconds
    const timeout = setTimeout(() => {
      hideToast(id);
    }, 4000);
    
    // Store the timeout reference
    toastTimeoutsRef.current[id] = timeout;
  };

  // Function to hide a toast
  const hideToast = (id: string) => {
    // Clear the timeout when hiding a toast
    if (toastTimeoutsRef.current[id]) {
      clearTimeout(toastTimeoutsRef.current[id]);
      delete toastTimeoutsRef.current[id];
    }
    
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  // Clean up all timeouts when component unmounts
  useEffect(() => {
    return () => {
      // Clear all timeouts on unmount
      Object.values(toastTimeoutsRef.current).forEach(clearTimeout);
    };
  }, []);

  return (
    <ToastContext.Provider value={{ showToast, hideToast }}>
      {children}
      <ToastContainer toasts={toasts} hideToast={hideToast} />
    </ToastContext.Provider>
  );
}

// Hook to use toast
export const useToast = () => {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
};

// Toast Container component
function ToastContainer({ toasts, hideToast }: { toasts: Toast[]; hideToast: (id: string) => void }) {
  return (
    <>
      {/* Backdrop overlay that covers the entire screen with 40% opacity */}
      {toasts.length > 0 && (
        <div 
          className="fixed inset-0 bg-black z-999990 transition-opacity duration-300" style={{opacity: 0.4}}
          onClick={() => toasts.forEach(toast => hideToast(toast.id))}
        />
      )}
      
      {/* Toast notifications - keep them in the bottom center */}
      <div className="fixed bottom-8 z-999990 left-1/2 transform -translate-x-1/2 flex flex-col gap-3">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onClose={() => hideToast(toast.id)} />
        ))}
      </div>
    </>
  );
}

// Individual Toast Item component
function ToastItem({ toast }: { toast: Toast; onClose: () => void }) {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // Start exit animation 500ms before actually removing
    const timer = setTimeout(() => setIsExiting(true), 3500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 rounded-lg min-w-[280px] max-w-md shadow-lg transform transition-all duration-300 ${
        isExiting ? "opacity-0 translate-y-2" : "opacity-100"
      } ${
        toast.type === "success"
          ? "bg-black text-white"
          : "bg-black text-white"
      }`}
    >
      {toast.type === "success" ? (
        <IoCheckmarkCircle className="text-green-500 text-xl flex-shrink-0" />
      ) : (
        <IoIosAlert className="text-red-500 text-xl flex-shrink-0" />
      )}
      <span className="text-sm font-medium">{toast.message}</span>
    </div>
  );
}

// Example usage:
// In your component:
// const { showToast } = useToast();
// showToast("Operation completed successfully", "success");
// showToast("Please subscribe to unlock this filter", "error");
