import { Router } from "express";

import { AuthenticatedRequest, optionalAuth, requireAuth } from "@/auth/middleware";
import passport from "@/auth/passport";
import { getAuthCookieName, signAuthToken } from "@/auth/jwt";
import { env } from "@/env";
import { prisma } from "@/db/client";
import { logger } from "@/logger";

const router = Router();

const baseCookieOptions = {
  httpOnly: true,
  secure: env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
};

router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"], session: false }),
);

router.get(
  "/google/callback",
  passport.authenticate("google", {
    session: false,
    failureRedirect: `${env.CLIENT_URL}?auth_error=google`,
  }),
  (req, res) => {
    const user = req.user as { id: string; email?: string } | undefined;

    if (!user) {
      logger.warn("Google callback without user payload");
      return res.redirect(`${env.CLIENT_URL}?auth_error=missing_user`);
    }

    const token = signAuthToken({ sub: user.id, email: user.email });

    res.cookie(getAuthCookieName(), token, {
      ...baseCookieOptions,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    return res.redirect(`${env.CLIENT_URL}/dashboard`);
  },
);

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
