"use client";

import type { ReactNode } from "react";

import { useAuth } from "@/auth/auth-provider";
import type { Role } from "@/auth/types";

export function RoleGate({
  allow,
  children,
}: Readonly<{ allow: Role[]; children: ReactNode }>) {
  const { user } = useAuth();
  return user && allow.includes(user.role) ? children : null;
}
