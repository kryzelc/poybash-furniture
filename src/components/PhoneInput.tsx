"use client";

import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface PhoneInputProps {
  id?: string;
  label?: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  error?: string;
  required?: boolean;
  placeholder?: string;
  className?: string;
}

export const PhoneInput: React.FC<PhoneInputProps> = ({
  id = "phone",
  label = "Phone Number",
  value,
  onChange,
  onBlur,
  error,
  required = false,
  placeholder = "932 549 0596",
  className = "",
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let inputValue = e.target.value;

    // Remove the +63 prefix if user accidentally types it
    if (inputValue.startsWith("+63")) {
      inputValue = inputValue.slice(3);
    }

    // Only allow digits
    let digitsOnly = inputValue.replace(/\D/g, "");

    // Limit to 10 digits
    digitsOnly = digitsOnly.slice(0, 10);

    // Auto-format as user types: 9XX XXX XXXX
    let formatted = "";
    if (digitsOnly.length > 0) {
      if (digitsOnly.length <= 3) {
        formatted = digitsOnly;
      } else if (digitsOnly.length <= 6) {
        formatted = `${digitsOnly.slice(0, 3)} ${digitsOnly.slice(3)}`;
      } else {
        formatted = `${digitsOnly.slice(0, 3)} ${digitsOnly.slice(3, 6)} ${digitsOnly.slice(6)}`;
      }
    }

    onChange(formatted);
  };

  // Display the phone with +63 prefix (for internal use)
  // The +63 will be added during form submission/validation

  return (
    <div className="space-y-2">
      {label && (
        <Label htmlFor={id}>
          {label} {required && "*"}
        </Label>
      )}
      <Input
        id={id}
        type="tel"
        inputMode="numeric"
        value={`+63 ${value}`}
        onChange={handleChange}
        onBlur={onBlur}
        placeholder={`+63 ${placeholder}`}
        className={`${error ? "border-red-500" : ""} ${className}`}
        required={required}
        pattern="\+63 [0-9 ]*"
        maxLength={17}
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
};
