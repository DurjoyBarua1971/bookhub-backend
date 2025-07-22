export interface User {
  _id: string;
  name: string;
  email: string;
  password: string;
  role: 41 | 109; // 41 for user, 109 for admin
  organization?: string;
}