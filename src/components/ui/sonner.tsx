"use client";

import { Toaster as Sonner, ToasterProps } from "sonner";

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="light"
      className="toaster group"
      position="top-center"
      visibleToasts={1}
      duration={4000}
      toastOptions={{
        unstyled: false,
        classNames: {
          toast:
            "group toast !min-h-[60px] !rounded-lg !shadow-lg !px-4 !py-3 !flex !items-start !gap-3",
          title: "!text-sm !font-semibold !m-0 !leading-snug",
          description: "!text-xs !opacity-75 !mt-1 !leading-snug",
          icon: "!w-6 !h-6 !mt-0 !flex-shrink-0 !rounded-full",
          success: "toast-success",
          error: "toast-error",
          warning: "toast-warning",
          info: "toast-info",
          closeButton:
            "!right-3 !top-3 !w-5 !h-5 !rounded-md !opacity-70 hover:!opacity-100 !transition-opacity",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
