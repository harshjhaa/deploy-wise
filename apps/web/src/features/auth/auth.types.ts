export type AuthUser = {
  id: string;
  name: string | null;
  email: string;
  role: string;
};

export type AuthFormValues = {
  name?: string;
  email: string;
  password: string;
};
