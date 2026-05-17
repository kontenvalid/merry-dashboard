"use client";

import { SessionProvider } from "@/components/session-provider";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { status } = useSession();

  if (status === "unauthenticated") {
    redirect("/api/auth/signin");
  }

  return <>{children}</>;
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SessionProvider>
      <AuthGuard>{children}</AuthGuard>
    </SessionProvider>
  );
}