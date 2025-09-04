import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { createClient } from "@supabase/supabase-js";

// Validate required environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const nextAuthSecret = process.env.NEXTAUTH_SECRET;
const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;

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
    // Google OAuth Provider
    GoogleProvider({
      clientId: googleClientId!,
      clientSecret: googleClientSecret!,
    }),
    // Email/Password Provider
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        action: { label: "Action", type: "text" }, // 'login' or 'register'
        name: { label: "Name", type: "text" },
        otp: { label: "OTP", type: "text" }
      },
      async authorize(credentials: any) {
        if (!credentials?.email || !credentials?.action) {
          return null;
        }

        // Handle admin-only login
        if (credentials.action === 'login_admin') {
          if (!credentials.password) return null;

          const { data: admin } = await supabase
            .from("admin_users")
            .select("*")
            .eq("email", credentials.email)
            .single();

          if (!admin) return null;

          const passwordMatch = await bcrypt.compare(
            credentials.password,
            admin.password_hash
          );
          if (!passwordMatch) return null;

          return {
            id: admin.id,
            email: admin.email,
            name: admin.name,
            isAdmin: true,
          };
        }

        // Handle user-only login
        if (credentials.action === 'login_user') {
          if (!credentials.password) return null;

          const { data: user } = await supabase
            .from("users")
            .select(`
              *,
              subscriptions (
                id,
                plan_id,
                status,
                subscription_plans (
                  name,
                  ai_queries_limit
                )
              )
            `)
            .eq("email", credentials.email)
            .eq("provider", "email")
            .single();

          if (!user || !user.password_hash) return null;

          const passwordMatch = await bcrypt.compare(
            credentials.password,
            user.password_hash
          );

          if (!passwordMatch) return null;

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            emailVerified: user.email_verified,
            subscription: user.subscriptions?.[0] || null,
            isAdmin: false,
          };
        }

        // Backwards-compatible mixed login (admin first, then user)
        if (credentials.action === 'login') {
          if (!credentials.password) return null;

          // First check admin users (for existing admin functionality)
          const { data: admin } = await supabase
            .from("admin_users")
            .select("*")
            .eq("email", credentials.email)
            .single();

          if (admin) {
            const passwordMatch = await bcrypt.compare(
              credentials.password,
              admin.password_hash
            );
            if (passwordMatch) {
              return {
                id: admin.id,
                email: admin.email,
                name: admin.name,
                isAdmin: true,
              };
            }
          }

          // Check regular users if not admin
          const { data: user } = await supabase
            .from("users")
            .select(`
              *,
              subscriptions (
                id,
                plan_id,
                status,
                subscription_plans (
                  name,
                  ai_queries_limit
                )
              )
            `)
            .eq("email", credentials.email)
            .eq("provider", "email")
            .single();

          if (!user || !user.password_hash) return null;

          const passwordMatch = await bcrypt.compare(
            credentials.password,
            user.password_hash
          );

          if (!passwordMatch) return null;

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            emailVerified: user.email_verified,
            subscription: user.subscriptions?.[0] || null,
            isAdmin: false,
          };
        }

        // Handle registration with OTP verification
        if (credentials.action === 'register') {
          if (!credentials.password || !credentials.name || !credentials.otp) {
            return null;
          }

          // Verify OTP (get the most recent matching record)
          const { data: verifications } = await supabase
            .from("email_verifications")
            .select("*")
            .eq("otp", credentials.otp)
            .gt("expires_at", new Date().toISOString())
            .is("verified_at", null)
            .order("created_at", { ascending: false })
            .limit(1);

          const verification = Array.isArray(verifications) ? verifications[0] : null;

          if (!verification) {
            throw new Error("Invalid or expired OTP");
          }

          // Hash password
          const hashedPassword = await bcrypt.hash(credentials.password, 12);

          // Create user
          const { data: newUser, error } = await supabase
            .from("users")
            .insert({
              email: credentials.email,
              name: credentials.name,
              password_hash: hashedPassword,
              email_verified: true,
              provider: "email"
            })
            .select()
            .single();

          if (error) {
            throw new Error("Failed to create user");
          }

          // Mark OTP as verified
          await supabase
            .from("email_verifications")
            .update({ verified_at: new Date().toISOString() })
            .eq("id", verification.id);

          return {
            id: newUser.id,
            email: newUser.email,
            name: newUser.name,
            emailVerified: true,
            isAdmin: false,
          };
        }

        return null;
      },
    }),
  ],
  session: {
    strategy: "jwt" as const,
  },
  pages: {
    signIn: "/login",
    signUp: "/signup",
    error: "/auth/error",
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
    async signIn({ user, account }: any) {
      // Handle Google OAuth
      if (account?.provider === "google") {
        const { data: existingUser } = await supabase
          .from("users")
          .select("*")
          .eq("email", user.email!)
          .single();

        if (!existingUser) {
          // Create new user from Google OAuth
          const { error } = await supabase
            .from("users")
            .insert({
              email: user.email!,
              name: user.name!,
              avatar_url: user.image,
              email_verified: true,
              provider: "google",
              provider_id: user.id,
            });

          if (error) {
            console.error("Error creating Google user:", error);
            return false;
          }
        } else {
          // Update last login
          await supabase
            .from("users")
            .update({ 
              last_login: new Date().toISOString(),
              avatar_url: user.image 
            })
            .eq("id", existingUser.id);
        }
      }

      return true;
    },
    async jwt({ token, user, account, trigger }: any) {
      if (user) {
        token.id = user.id;
        token.isAdmin = user.isAdmin || false;
        token.subscription = user.subscription;
      }

      // Always fetch fresh user data from database when session is updated
      if (trigger === "update" && token.email) {
        const { data: dbUser } = await supabase
          .from("users")
          .select(`
            *,
            subscriptions!subscriptions_user_id_fkey (
              id,
              plan_id,
              status,
              subscription_plans (
                name,
                ai_queries_limit
              )
            )
          `)
          .eq("email", token.email)
          .single();

        if (dbUser) {
          token.id = dbUser.id;
          token.subscription = dbUser.subscriptions?.[0] || null;
          token.picture = dbUser.avatar_url;
        }
      }

      // If this is a Google OAuth sign in, fetch user data from DB using email
      if (account?.provider === "google" && token.email) {
        const { data: dbUser } = await supabase
          .from("users")
          .select(`
            *,
            subscriptions!subscriptions_user_id_fkey (
              id,
              plan_id,
              status,
              subscription_plans (
                name,
                ai_queries_limit
              )
            )
          `)
          .eq("email", token.email)
          .single();

        if (dbUser) {
          token.id = dbUser.id; // Use the database UUID, not Google ID
          token.subscription = dbUser.subscriptions?.[0] || null;
          token.picture = dbUser.avatar_url;
        }
      }

      // Always ensure we have the correct user ID and avatar from database for any provider
      if (!token.id || typeof token.id !== 'string' || token.id.length < 36) {
        const { data: dbUser } = await supabase
          .from("users")
          .select("id, avatar_url")
          .eq("email", token.email)
          .single();

        if (dbUser) {
          token.id = dbUser.id;
          token.picture = dbUser.avatar_url;
        }
      }

      return token;
    },
    async session({ session, token }: any) {
      if (session?.user) {
        session.user.id = token.id as string;
        session.user.isAdmin = token.isAdmin as boolean;
        session.user.subscription = token.subscription;
        session.user.image = token.picture;
      }
      return session;
    },
  },
  secret: nextAuthSecret,
  debug: true, // Enable debug for production troubleshooting
};
