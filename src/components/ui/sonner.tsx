"use client";

import { Toaster as Sonner, ToasterProps } from "sonner";

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="light"
      className="toaster group"
      toastOptions={{
        unstyled: false,
        style: {
          background: '#FDFBF7',
          color: '#5D4037',
          border: '1px solid rgba(93, 64, 55, 0.2)',
          fontSize: '14px',
          fontWeight: '500',
        },
        classNames: {
          toast: '!bg-[#FDFBF7] !text-[#5D4037] !border-[#5D4037]/20',
          title: '!text-[#5D4037]',
          description: '!text-[#795548]',
          actionButton: '!bg-[#5D4037] !text-[#FDFBF7]',
          cancelButton: '!bg-[#EFEBE9] !text-[#5D4037]',
          closeButton: '!bg-[#EFEBE9] !text-[#5D4037] !border-[#5D4037]/20',
        },
      }}
      {...props}
    />
  );
};

export { Toaster };