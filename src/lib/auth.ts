import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import prisma from "./prisma";

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
        (session.user as { role?: string }).role = user.role;
      }
      return session;
    },
  },
  events: {
    async createUser({ user }) {
      // Check if this is the first user (make them admin)
      const userCount = await prisma.user.count();
      if (userCount === 1) {
        // Update user role to ADMIN
        await prisma.user.update({
          where: { id: user.id },
          data: { role: "ADMIN" },
        });
        console.log("First user set as ADMIN:", user.email);
      }
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
  const user = await prisma.user.findUnique({
    where: { email },
    select: { role: true },
  });
  return user?.role === "ADMIN";
}

// Helper to check if user is the first admin (from Composio email)
export async function isFirstAdmin(email: string): Promise<boolean> {
  const FIRST_ADMIN_EMAIL = "kontenval.id@gmail.com";
  if (email.toLowerCase() !== FIRST_ADMIN_EMAIL.toLowerCase()) {
    return false;
  }
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
    select: { role: true },
  });
  return user?.role === "ADMIN";
}