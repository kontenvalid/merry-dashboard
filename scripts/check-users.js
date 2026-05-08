const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  console.log('=== Users ===\n')
  const users = await prisma.user.findMany({ take: 5 })
  
  for (const u of users) {
    console.log(`ID: ${u.id}`)
    console.log(`  Email: ${u.email}`)
    console.log(`  Name: ${u.name}`)
    console.log('')
  }
  
  await prisma.$disconnect()
}

main().catch(e => { console.error(e); prisma.$disconnect() })