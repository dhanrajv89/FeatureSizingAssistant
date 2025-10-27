import { NextFunction, Request, Response } from "express";

import { getAuthCookieName, verifyAuthToken } from "@/auth/jwt";

export type AuthenticatedRequest = Request & {
  user?: {
    id: string;
    email?: string | null;
  };
};

const extractToken = (req: Request): string | null => {
  const cookieToken = req.cookies?.[getAuthCookieName()];
  if (cookieToken) {
    return cookieToken;
  }

  const authHeader = req.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.slice(7);
  }

  return null;
};

export const requireAuth = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  const token = extractToken(req);

  if (!token) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
    const payload = verifyAuthToken(token);
    req.user = { id: payload.sub, email: payload.email ?? null };
    next();
  } catch (_error) {
    res.status(401).json({ error: "Invalid token" });
  }
};

export const optionalAuth = (
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction,
) => {
  const token = extractToken(req);
  if (!token) {
    next();
    return;
  }

  try {
    const payload = verifyAuthToken(token);
    req.user = { id: payload.sub, email: payload.email ?? null };
  } catch (_error) {
    // ignore invalid token, proceed unauthenticated
  }

  next();
};
