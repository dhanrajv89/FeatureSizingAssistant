import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";

import { env } from "@/env";
import { prisma } from "@/db/client";
import { logger } from "@/logger";

passport.use(
  new GoogleStrategy(
    {
      clientID: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
      callbackURL: `${env.SERVER_URL}/auth/google/callback`,
    },
    async (_accessToken, _refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value;
        if (!email) {
          return done(new Error("Google account does not provide an email"));
        }

        const image = profile.photos?.[0]?.value ?? null;
        const displayName = profile.displayName ?? null;

        const user = await prisma.user.upsert({
          where: { email },
          update: {
            name: displayName,
            image,
            provider: "google",
            providerId: profile.id,
          },
          create: {
            email,
            name: displayName,
            image,
            provider: "google",
            providerId: profile.id,
          },
        });

        logger.info("Google OAuth success", { userId: user.id, email: user.email });

        return done(null, { id: user.id, email: user.email });
      } catch (error) {
        logger.error("Google OAuth failure", error);
        return done(error as Error);
      }
    },
  ),
);

export default passport;
