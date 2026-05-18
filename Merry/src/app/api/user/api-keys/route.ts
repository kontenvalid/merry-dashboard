import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET - Fetch user's API keys
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get API keys
    const apiKey = await prisma.apiKey.findUnique({
      where: { 
        userId_service: {
          userId: user.id,
          service: "user_keys"
        }
      },
    });

    let keys = {
      meta_token: "",
      x_api_key: "",
      zernio_api_key: "",
    };

    if (apiKey?.apiKey) {
      try {
        const parsed = JSON.parse(apiKey.apiKey);
        keys = {
          meta_token: parsed.meta_token || "",
          x_api_key: parsed.x_api_key || "",
          zernio_api_key: parsed.zernio_api_key || "",
        };
      } catch (e) {
        // If not JSON, treat as meta_token directly
        keys.meta_token = apiKey.apiKey;
      }
    }

    return NextResponse.json({
      keys,
      isConfigured: !!(keys.meta_token || keys.x_api_key || keys.zernio_api_key),
    });

  } catch (error) {
    console.error("Error fetching API keys:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST - Save user's API keys
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { meta_token, x_api_key, zernio_api_key } = body;

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Upsert API keys
    await prisma.apiKey.upsert({
      where: {
        userId_service: {
          userId: user.id,
          service: "user_keys"
        }
      },
      update: {
        apiKey: JSON.stringify({ meta_token, x_api_key, zernio_api_key }),
        isActive: true,
        updatedAt: new Date(),
      },
      create: {
        userId: user.id,
        service: "user_keys",
        apiKey: JSON.stringify({ meta_token, x_api_key, zernio_api_key }),
        isActive: true,
      },
    });

    return NextResponse.json({ 
      success: true, 
      message: "API keys saved successfully" 
    });

  } catch (error) {
    console.error("Error saving API keys:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}