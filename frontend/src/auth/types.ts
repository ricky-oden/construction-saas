export type Role = "ADMIN" | "MANAGER" | "MEMBER";

export type AssigneeIdentity = {
  id: number;
  display_name: string;
};

export type AuthUser = {
  id: number;
  email: string;
  role: Role;
  assignee: AssigneeIdentity | null;
};

export type LoginResponse = {
  token: string;
  token_type: "bearer";
  expires_at: string;
  user: AuthUser;
};
