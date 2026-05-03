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
    async session({ session, user }) {
      // Add role to session
      if (session.user) {
        // Get fresh user data from DB to ensure role is correct
        const dbUser = await prisma.user.findUnique({
          where: { email: session.user.email ?? undefined },
          select: { role: true, email: true },
        });
        
        // kontenval.id@gmail.com is always ADMIN
        const role = session.user.email?.toLowerCase() === FIRST_ADMIN_EMAIL.toLowerCase()
          ? "ADMIN"
          : dbUser?.role ?? "MEMBER";
        
        (session.user as any).role = role;
        (session.user as any).id = user.id;
      }
      return session;
    },
    async jwt({ token, user }) {
      // On initial sign in
      if (user) {
        // kontenval.id@gmail.com is always ADMIN
        const role = user.email?.toLowerCase() === FIRST_ADMIN_EMAIL.toLowerCase()
          ? "ADMIN"
          : (user as any).role ?? "MEMBER";
        
        token.role = role;
        token.id = user.id;
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
