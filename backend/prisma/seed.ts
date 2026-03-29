import "dotenv/config"
import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL as string,
})

const prisma = new PrismaClient({ adapter })

async function main() {
  const user = await prisma.user.upsert({
    where: { email: "dev@krone.local" },
    update: {},
    create: {
      name: "Dev User",
      email: "dev@krone.local",
      passwordHash: "dev-only",
      currency: "CRC",
    },
  })

  console.log(`Seed user ready — id: ${user.id}`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())