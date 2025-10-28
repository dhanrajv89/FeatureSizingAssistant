import jwt, { type Secret, type SignOptions } from "jsonwebtoken";

import { env } from "@/env";

type AuthTokenPayload = {
  sub: string;
  email?: string | null;
};

const TOKEN_NAME = "feature-sizing-token";
const JWT_SECRET = env.AUTH_JWT_SECRET as Secret;
const JWT_EXPIRES_IN = env.AUTH_JWT_EXPIRES_IN;
const JWT_OPTIONS: SignOptions = { expiresIn: JWT_EXPIRES_IN };

export const getAuthCookieName = () => TOKEN_NAME;

export const signAuthToken = (payload: AuthTokenPayload) =>
  jwt.sign(payload, JWT_SECRET, JWT_OPTIONS);

export const verifyAuthToken = (token: string) =>
  jwt.verify(token, JWT_SECRET) as AuthTokenPayload;

export type { AuthTokenPayload };


