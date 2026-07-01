"use client";

import { Toaster } from "sonner";

export function AppToaster() {
  return (
    <Toaster
      position="top-center"
      richColors
      toastOptions={{
        classNames: {
          toast:
            "bg-city-navy-light border border-white/10 text-white shadow-lg",
        },
      }}
    />
  );
}
