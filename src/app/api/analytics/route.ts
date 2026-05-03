import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET - Get analytics data
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const platform = searchParams.get("platform");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const where: any = {};
    
    if (platform) {
      where.platform = platform;
    }
    
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) where.date.lte = new Date(endDate);
    }

    const analytics = await prisma.analytics.findMany({
      where,
      orderBy: { date: "desc" },
      take: 30, // Last 30 records
    });

    return NextResponse.json(analytics);
  } catch (error) {
    console.error("Error fetching analytics:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST - Create/Update analytics data (for cron jobs or manual entry)
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { role: true },
    });

    if (user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden - Admin only" }, { status: 403 });
    }

    const body = await request.json();
    const { platform, date, followers, following, posts, engagement, reach, impressions, likes, comments, shares, views, watchTime } = body;

    // Upsert - create or update
    const analytics = await prisma.analytics.upsert({
      where: {
        platform_date: {
          platform,
          date: new Date(date),
        },
      },
      update: {
        followers,
        following,
        posts,
        engagement,
        reach,
        impressions,
        likes,
        comments,
        shares,
        views,
        watchTime,
      },
      create: {
        platform,
        date: new Date(date),
        followers,
        following,
        posts,
        engagement,
        reach,
        impressions,
        likes,
        comments,
        shares,
        views,
        watchTime,
      },
    });

    return NextResponse.json(analytics);
  } catch (error) {
    console.error("Error creating analytics:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}