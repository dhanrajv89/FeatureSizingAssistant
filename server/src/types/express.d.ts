import type { User as PassportUser } from "passport";

declare global {
  namespace Express {
    interface User extends PassportUser {
      id: string;
      email?: string | null;
    }
  }
}

export {};
