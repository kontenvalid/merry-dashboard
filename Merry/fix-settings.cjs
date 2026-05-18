// Clean up and ensure proper per-user dashboard settings
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixDashboardSettings() {
  console.log('FIXING DASHBOARD SETTINGS...\n');

  // Get admin user
  const adminUser = await prisma.user.findUnique({
    where: { email: 'kontenval.id@gmail.com' }
  });

  if (!adminUser) {
    console.log('ERROR: Admin user not found!');
    return;
  }

  console.log('Admin User ID:', adminUser.id);

  // 1. Delete all wrong settings (those with wrong userId)
  const wrongSettings = await prisma.dashboardSettings.findMany({
    where: {
      userId: {
        not: adminUser.id
      }
    }
  });

  console.log('\nDeleting', wrongSettings.length, 'wrong settings...');
  for (const s of wrongSettings) {
    console.log(' - DELETING:', s.id, '(userId:', s.userId + ')');
    await prisma.dashboardSettings.delete({
      where: { id: s.id }
    });
  }

  // 2. Check if admin has settings
  let adminSettings = await prisma.dashboardSettings.findFirst({
    where: { userId: adminUser.id }
  });

  // 3. If duplicate, keep only one
  const allAdminSettings = await prisma.dashboardSettings.findMany({
    where: { userId: adminUser.id }
  });

  if (allAdminSettings.length > 1) {
    console.log('\nFound', allAdminSettings.length, 'settings for admin. Keeping one, deleting others...');
    
    // Keep the first one
    const keep = allAdminSettings[0];
    console.log('Keeping:', keep.id);
    
    // Delete others
    for (let i = 1; i < allAdminSettings.length; i++) {
      console.log('Deleting duplicate:', allAdminSettings[i].id);
      await prisma.dashboardSettings.delete({
        where: { id: allAdminSettings[i].id }
      });
    }

    adminSettings = await prisma.dashboardSettings.findFirst({
      where: { userId: adminUser.id }
    });
  }

  // 4. Create settings if missing
  if (!adminSettings) {
    console.log('\nCreating new settings for admin...');
    adminSettings = await prisma.dashboardSettings.create({
      data: {
        userId: adminUser.id,
        theme: 'system',
        language: 'en',
        timezone: 'Asia/Bangkok'
      }
    });
    console.log('Created:', adminSettings.id);
  } else {
    console.log('\nAdmin settings exist:', adminSettings.id);
    console.log('Theme:', adminSettings.theme);
    console.log('Timezone:', adminSettings.timezone);
  }

  console.log('\n✅ Dashboard settings cleaned up!');

  await prisma.$disconnect();
}

fixDashboardSettings().catch(console.error);