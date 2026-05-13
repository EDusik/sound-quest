import { z } from "zod";

const serverSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).optional(),
  VERCEL_URL: z.string().optional(),

  NEXT_SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),

  NEXT_ANTHROPIC_API_KEY: z.string().min(1).optional(),
  NEXT_ANTHROPIC_MODEL: z.string().optional(),

  NEXT_PIXABAY_API_KEY: z.string().optional(),
  NEXT_PIXABAY_SOUNDS_API_URL: z.string().optional(),

  NEXT_SERPER_API_KEY: z.string().optional(),

  NEXT_USER_ADMIN: z.string().optional(),

  MERCADO_PAGO_ACCESS_TOKEN: z.string().optional(),
  MERCADO_PAGO_WEBHOOK_SECRET: z.string().optional(),
  MERCADO_PAGO_NOTIFICATION_URL: z.string().optional(),
  MERCADO_PAGO_DONATION_PAYER_EMAIL: z.string().optional(),
});

const clientSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1).optional(),

  NEXT_PUBLIC_USER_ADMIN: z.string().optional(),
  NEXT_PUBLIC_SITE_URL: z.string().optional(),
  NEXT_PUBLIC_STRIPE_URL: z.string().optional(),
  NEXT_PUBLIC_GITHUB_URL: z.string().optional(),

  NEXT_PUBLIC_USE_FIRESTORE: z.string().optional(),
  NEXT_PUBLIC_FIREBASE_API_KEY: z.string().optional(),
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: z.string().optional(),
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: z.string().optional(),
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: z.string().optional(),
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: z.string().optional(),
  NEXT_PUBLIC_FIREBASE_APP_ID: z.string().optional(),
});

const clientValues = {
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  NEXT_PUBLIC_USER_ADMIN: process.env.NEXT_PUBLIC_USER_ADMIN,
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  NEXT_PUBLIC_STRIPE_URL: process.env.NEXT_PUBLIC_STRIPE_URL,
  NEXT_PUBLIC_GITHUB_URL: process.env.NEXT_PUBLIC_GITHUB_URL,
  NEXT_PUBLIC_USE_FIRESTORE: process.env.NEXT_PUBLIC_USE_FIRESTORE,
  NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET:
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID:
    process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  NEXT_PUBLIC_FIREBASE_APP_ID: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const isServer = typeof window === "undefined";

const serverValues = isServer
  ? {
      NODE_ENV: process.env.NODE_ENV,
      VERCEL_URL: process.env.VERCEL_URL,
      NEXT_SUPABASE_SERVICE_ROLE_KEY: process.env.NEXT_SUPABASE_SERVICE_ROLE_KEY,
      NEXT_ANTHROPIC_API_KEY: process.env.NEXT_ANTHROPIC_API_KEY,
      NEXT_ANTHROPIC_MODEL: process.env.NEXT_ANTHROPIC_MODEL,
      NEXT_PIXABAY_API_KEY: process.env.NEXT_PIXABAY_API_KEY,
      NEXT_PIXABAY_SOUNDS_API_URL: process.env.NEXT_PIXABAY_SOUNDS_API_URL,
      NEXT_SERPER_API_KEY: process.env.NEXT_SERPER_API_KEY,
      NEXT_USER_ADMIN: process.env.NEXT_USER_ADMIN,
      MERCADO_PAGO_ACCESS_TOKEN: process.env.MERCADO_PAGO_ACCESS_TOKEN,
      MERCADO_PAGO_WEBHOOK_SECRET: process.env.MERCADO_PAGO_WEBHOOK_SECRET,
      MERCADO_PAGO_NOTIFICATION_URL: process.env.MERCADO_PAGO_NOTIFICATION_URL,
      MERCADO_PAGO_DONATION_PAYER_EMAIL:
        process.env.MERCADO_PAGO_DONATION_PAYER_EMAIL,
    }
  : {};

const clientParsed = clientSchema.parse(clientValues);
const serverParsed = isServer ? serverSchema.parse(serverValues) : {};

export const env = {
  ...clientParsed,
  ...serverParsed,
} as z.infer<typeof clientSchema> & Partial<z.infer<typeof serverSchema>>;
