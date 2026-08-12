import type { ButtonHTMLAttributes } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  loading?: boolean;
};

export function Button({
  children,
  disabled,
  loading = false,
  ...props
}: ButtonProps) {
  return (
    <button
      className="button"
      disabled={disabled || loading}
      type="button"
      {...props}
    >
      {loading ? "処理中です…" : children}
    </button>
  );
}
