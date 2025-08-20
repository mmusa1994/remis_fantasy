import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { createClient } from "@supabase/supabase-js";

// Validate required environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const nextAuthSecret = process.env.NEXTAUTH_SECRET;

if (!supabaseUrl) {
  throw new Error("Missing env var NEXT_PUBLIC_SUPABASE_URL");
}

if (!supabaseServiceKey) {
  throw new Error("Missing env var SUPABASE_SERVICE_ROLE_KEY");
}

if (!nextAuthSecret) {
  throw new Error("Missing env var NEXTAUTH_SECRET");
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials: any) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        // Check admin users table
        const { data: admin, error } = await supabase
          .from("admin_users")
          .select("*")
          .eq("email", credentials.email)
          .single();

        if (error || !admin) {
          return null;
        }

        const passwordMatch = await bcrypt.compare(
          credentials.password,
          admin.password_hash
        );

        if (!passwordMatch) {
          return null;
        }

        return {
          id: admin.id,
          email: admin.email,
          name: admin.name,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt" as const,
  },
  pages: {
    signIn: "/admin",
    error: "/admin",
  },
  useSecureCookies: process.env.NODE_ENV === "production",
  cookies: {
    sessionToken: {
      name:
        process.env.NODE_ENV === "production"
          ? "__Secure-next-auth.session-token"
          : "next-auth.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax" as const,
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
  callbacks: {
    async jwt({ token, user }: any) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }: any) {
      if (session?.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
  secret: nextAuthSecret,
  debug: true, // Enable debug for production troubleshooting
};
