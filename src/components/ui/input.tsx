import { type InputHTMLAttributes, forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = "", id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-caption text-text-secondary">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`h-10 px-3 bg-bg-tertiary border border-border-default rounded-lg text-text-primary font-mono text-body placeholder:text-text-disabled transition-colors duration-200 focus:border-border-active focus:outline-none ${error ? "border-accent-danger" : ""} ${className}`}
          {...props}
        />
        {error && (
          <span className="text-caption text-accent-danger">{error}</span>
        )}
      </div>
    );
  },
);

Input.displayName = "Input";
