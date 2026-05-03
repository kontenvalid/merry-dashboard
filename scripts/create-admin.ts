import { PrismaClient } from "@prisma/client";
import { Prisma } from "@prisma/client";

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

async function main() {
  // Create admin user for kontenval.id@gmail.com
  const adminEmail = "kontenval.id@gmail.com";
  
  try {
    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email: adminEmail },
    });

    if (existingUser) {
      // Update role to ADMIN if not already
      if (existingUser.role !== "ADMIN") {
        await prisma.user.update({
          where: { email: adminEmail },
          data: { role: "ADMIN" },
        });
        console.log("✅ Updated user role to ADMIN");
      } else {
        console.log("ℹ️ User already has ADMIN role");
      }
    } else {
      // Create new admin user
      await prisma.user.create({
        data: {
          email: adminEmail,
          name: "Satria Ady Chandra",
          role: "ADMIN",
          emailVerified: new Date(),
        },
      });
      console.log("✅ Created admin user");
    }
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
