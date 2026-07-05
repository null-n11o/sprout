export interface AdminUser {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  role: string;
  birthDate?: string;
  gender?: string;
  createdAt: string;
  lastSignInAt?: string;
  provider: string;
}
