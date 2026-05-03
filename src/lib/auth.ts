import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import prisma from "./prisma";

const FIRST_ADMIN_EMAIL = "kontenval.id@gmail.com";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    }),
  ],
  callbacks: {
    async session({ session, token }) {
      // Add role from token (set in jwt callback)
      if (session.user) {
        (session.user as any).role = token.role ?? "MEMBER";
        (session.user as any).id = token.id;
      }
      return session;
    },
    async jwt({ token, user }) {
      // On initial sign in, user object is available
      if (user) {
        // kontenval.id@gmail.com is always ADMIN
        const isFirstAdmin = user.email?.toLowerCase() === FIRST_ADMIN_EMAIL.toLowerCase();
        token.role = isFirstAdmin ? "ADMIN" : "MEMBER";
        token.id = user.id;
        
        // Also update user's role in database for first admin
        if (isFirstAdmin) {
          try {
            await prisma.user.update({
              where: { id: user.id },
              data: { role: "ADMIN" },
            }).catch(() => {}); // Ignore errors
          } catch (e) {
            // Ignore
          }
        }
      }
      return token;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
};

// Helper to check if user is admin
export async function isAdmin(email: string): Promise<boolean> {
  if (email.toLowerCase() === FIRST_ADMIN_EMAIL.toLowerCase()) {
    return true;
  }
  const user = await prisma.user.findUnique({
    where: { email },
    select: { role: true },
  });
  return user?.role === "ADMIN";
}