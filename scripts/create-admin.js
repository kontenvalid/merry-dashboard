const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

async function main() {
  const adminEmail = "kontenval.id@gmail.com";
  
  try {
    const existingUser = await prisma.user.findUnique({
      where: { email: adminEmail },
    });

    if (existingUser) {
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
      console.log("ℹ️ User not found yet - will be created on first login");
    }
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
