import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    let settings = await prisma.dashboardSettings.findFirst({
      where: { userId: user.id },
    });

    if (!settings) {
      settings = await prisma.dashboardSettings.create({
        data: {
          userId: user.id,
          theme: "system",
          language: "en",
          timezone: "Asia/Jakarta",
        },
      });
    }

    return NextResponse.json({
      settings: {
        theme: settings.theme,
        language: settings.language,
        timezone: settings.timezone,
      },
    });
  } catch (error) {
    console.error("Error fetching user settings:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { theme, language, timezone } = body;

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    let existingSettings = await prisma.dashboardSettings.findFirst({
      where: { userId: user.id },
    });

    let settings;
    if (existingSettings) {
      settings = await prisma.dashboardSettings.update({
        where: { id: existingSettings.id },
        data: {
          theme: theme || "system",
          language: language || "en",
          timezone: timezone || "Asia/Jakarta",
        },
      });
    } else {
      settings = await prisma.dashboardSettings.create({
        data: {
          userId: user.id,
          theme: theme || "system",
          language: language || "en",
          timezone: timezone || "Asia/Jakarta",
        },
      });
    }

    return NextResponse.json({
      success: true,
      settings: {
        theme: settings.theme,
        language: settings.language,
        timezone: settings.timezone,
      },
    });
  } catch (error) {
    console.error("Error saving user settings:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}