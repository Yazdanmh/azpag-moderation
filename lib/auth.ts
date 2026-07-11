import { signIn } from "@/components/modules/auth/lib/services";
import { NextAuthOptions, getServerSession } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

function getExpFromJwt(token: string): number | null {
  try {
    const payload = token.split('.')[1];
    const decoded = JSON.parse(atob(payload));
    return decoded.exp ?? null;
  } catch {
    return null;
  }
}

async function refreshAccessToken(token: {
  access_token: string;
  refresh_token: string;
}): Promise<{
  access_token: string;
  refresh_token: string;
}> {
  const response = await fetch(`${BACKEND_URL}/api/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token: token.refresh_token }),
  });

  if (!response.ok) {
    throw new Error('Token refresh failed');
  }

  const data = await response.json();

  return {
    access_token: data.access_token || data.data?.access_token,
    refresh_token: data.refresh_token || data.data?.refresh_token || token.refresh_token,
  };
}

const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "email", type: "text", placeholder: "email" },
        password: { label: "Password", type: "password" },
      },

      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Missing credentials");
        }

        const { email, password } = credentials;

        const res = await signIn({
          email,
          password,
          platform: "WEB",
          access_level: "PRIVATE",
        });

        if (res?.status === 200 || res?.status === 201) {
          return res.data.data;
        }

        if (res?.status !== 429) {
          console.error('Login failed', res?.status, res?.error);
        }

        throw new Error(
          JSON.stringify({
            status: res?.status === 429 ? 429 : 401,
            message: "Invalid credentials",
          })
        );
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.user = (user as any).user;
        token.access_token = (user as any).access_token;
        token.refresh_token = (user as any).refresh_token;
      }

      if (trigger === "update" && session) {
        token.user = session.user;
      }

      if (token.access_token && token.refresh_token) {
        const exp = getExpFromJwt(token.access_token as string);

        if (exp) {
          const now = Math.floor(Date.now() / 1000);
          const buffer = 30;

          if (now >= exp - buffer) {
            try {
              const refreshed = await refreshAccessToken({
                access_token: token.access_token as string,
                refresh_token: token.refresh_token as string,
              });

              token.access_token = refreshed.access_token;
              token.refresh_token = refreshed.refresh_token;
            } catch {
              token.access_token = undefined;
              token.refresh_token = undefined;
              token.user = undefined;
            }
          }
        }
      }

      return token;
    },

    async session({ token, session }) {
      if (token) {
        session.user = token.user;
      }

      return session;
    },
  },

  secret: process.env.NEXTAUTH_SECRET,

  session: {
    strategy: "jwt",
    maxAge: 3 * 24 * 60 * 60,
  },

  pages: {
    signIn: "/auth/login",
    error: "/auth/login",
  },
};

const getSession = () => getServerSession(authOptions);

export { authOptions, getSession };