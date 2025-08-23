"use client";

import { forwardRef } from "react";
import { OTPInput, SlotProps } from "input-otp";
import { cn } from "@/lib/utils";

export interface InputOTPProps {
  value: string;
  onChange: (value: string) => void;
  maxLength?: number;
  disabled?: boolean;
  className?: string;
  containerClassName?: string;
}

function OTPSlot(props: SlotProps) {
  return (
    <div
      className={cn(
        "border-input bg-background text-foreground flex h-12 w-12 items-center justify-center rounded-md border font-medium shadow-xs transition-[color,box-shadow] text-lg",
        { "border-ring ring-ring/50 z-10 ring-[3px]": props.isActive }
      )}
    >
      {props.char !== null && <div>{props.char}</div>}
    </div>
  );
}

export const InputOTP = forwardRef<HTMLInputElement, InputOTPProps>(
  ({ value, onChange, maxLength = 6, disabled = false, className, containerClassName, ...props }, ref) => {
    return (
      <OTPInput
        ref={ref}
        value={value}
        onChange={onChange}
        maxLength={maxLength}
        disabled={disabled}
        containerClassName={cn("flex items-center gap-3 has-disabled:opacity-50", containerClassName)}
        className={className}
        render={({ slots }) => (
          <div className="flex gap-2">
            {slots.map((slot, idx) => (
              <OTPSlot key={idx} {...slot} />
            ))}
          </div>
        )}
        {...props}
      />
    );
  }
);

InputOTP.displayName = "InputOTP";