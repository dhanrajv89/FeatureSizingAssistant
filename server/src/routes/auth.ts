import { Router } from "express";
import { OAuth2Client } from "google-auth-library";

import { AuthenticatedRequest, optionalAuth, requireAuth } from "@/auth/middleware";
import { getAuthCookieName, signAuthToken } from "@/auth/jwt";
import { env } from "@/env";
import { prisma } from "@/db/client";
import { logger } from "@/logger";

const router = Router();
const googleClient = new OAuth2Client(env.GOOGLE_CLIENT_ID);

const baseCookieOptions = {
  httpOnly: true,
  secure: env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
};

router.post("/google", async (req, res) => {
  const credential: unknown = req.body?.credential;
  if (typeof credential !== "string" || credential.length === 0) {
    return res.status(400).json({ error: "Missing credential" });
  }

  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();

    if (!payload?.sub || !payload.email) {
      logger.warn("Google credential missing required fields");
      return res.status(401).json({ error: "Invalid Google credential" });
    }

    const fallbackName = `${payload.given_name ?? ""} ${payload.family_name ?? ""}`.trim();
    const displayName = payload.name ?? (fallbackName.length > 0 ? fallbackName : null);
    const user = await prisma.user.upsert({
      where: { email: payload.email },
      update: {
        name: displayName,
        image: payload.picture ?? null,
        provider: "google",
        providerId: payload.sub,
      },
      create: {
        email: payload.email,
        name: displayName,
        image: payload.picture ?? null,
        provider: "google",
        providerId: payload.sub,
      },
    });

    const token = signAuthToken({ sub: user.id, email: user.email });
    res.cookie(getAuthCookieName(), token, {
      ...baseCookieOptions,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    const responseUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      image: user.image,
      provider: user.provider,
      providerId: user.providerId,
    };

    return res.json({ user: responseUser });
  } catch (error) {
    logger.error("Failed to verify Google credential", error);
    return res.status(401).json({ error: "Invalid Google credential" });
  }
});

router.get("/me", requireAuth, async (req: AuthenticatedRequest, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    select: {
      id: true,
      email: true,
      name: true,
      image: true,
      provider: true,
      providerId: true,
    },
  });

  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  return res.json({ user });
});

router.post("/logout", optionalAuth, (_req, res) => {
  res.clearCookie(getAuthCookieName(), baseCookieOptions);
  return res.json({ ok: true });
});

export const authRouter = router;
