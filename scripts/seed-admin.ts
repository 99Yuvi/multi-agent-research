/**
 * Run once to create the first admin user:
 *   npx tsx scripts/seed-admin.ts
 */

import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import { hash } from "bcryptjs";

const dbUrl = process.env.DATABASE_URL ?? "file:./dev.db";
const adapter = new PrismaLibSql({ url: dbUrl });
const prisma = new PrismaClient({ adapter });

async function main() {
  const username = "admin";
  const password = "admin123"; // change after first login

  const existing = await prisma.user.findUnique({ where: { username } });
  if (existing) {
    console.log(`✓ Admin user "${username}" already exists.`);
    return;
  }

  const hashed = await hash(password, 12);
  await prisma.user.create({
    data: { username, password: hashed, role: "admin" },
  });

  console.log("✅ Admin user created:");
  console.log(`   Username : ${username}`);
  console.log(`   Password : ${password}`);
  console.log("   ⚠️  Change this password from the admin panel after first login.");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
