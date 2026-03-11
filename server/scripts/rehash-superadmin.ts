/**
 * One-time script to re-hash the superadmin's password using bcrypt.
 *
 * Usage:
 * npx ts-node scripts/rehash-superadmin.ts
 *
 * This is needed because the user was likely inserted with a plaintext
 * password_hash, causing bcrypt.compare() to fail on login.
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import 'dotenv/config';

// Guard: prevent accidental execution in production
if (process.env.NODE_ENV === 'production') {
  console.error('❌ This script must not be run in production.');
  process.exit(1);
}

async function main() {
  // Move env variables validation inside the function so TS narrows their types correctly to 'string'
  const SUPERADMIN_EMAIL = process.env.SUPERADMIN_EMAIL;
  const SUPERADMIN_PASSWORD = process.env.SUPERADMIN_PASSWORD;

  if (!SUPERADMIN_EMAIL || !SUPERADMIN_PASSWORD) {
    console.error('❌ SUPERADMIN_EMAIL and SUPERADMIN_PASSWORD environment variables are required.');
    process.exit(1);
  }

  const prisma = new PrismaClient();

  try {
    const user = await prisma.users.findUnique({
      where: { email: SUPERADMIN_EMAIL },
    });

    if (!user) {
      console.error(`❌ User with email "${SUPERADMIN_EMAIL}" not found in the database.`);
      console.log('Creating superadmin user...');

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(SUPERADMIN_PASSWORD, salt);

      await prisma.users.create({
        data: {
          email: SUPERADMIN_EMAIL,
          password_hash: hashedPassword,
          full_name: 'Super Admin',
          role: 'SUPER_ADMIN',
          status: 'ACTIVE',
        },
      });

      console.log('✅ Superadmin user created with a proper bcrypt hash.');
      return;
    }

    // Check if the password is already properly hashed
    const isAlreadyHashed = user.password_hash.startsWith('$2a$') || user.password_hash.startsWith('$2b$');

    if (isAlreadyHashed) {
      // Verify the existing hash works with the expected password
      const isValid = await bcrypt.compare(SUPERADMIN_PASSWORD, user.password_hash);
      if (isValid) {
        console.log('✅ Password is already correctly hashed. No changes needed.');
        return;
      }
      console.log('⚠️  Password is hashed but does not match the expected password. Re-hashing...');
    } else {
      console.log(`⚠️  Password hash is plaintext or non-bcrypt format: "${user.password_hash.substring(0, 10)}..."`);
      console.log('Re-hashing with bcrypt...');
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(SUPERADMIN_PASSWORD, salt);

    await prisma.users.update({
      where: { email: SUPERADMIN_EMAIL },
      data: { password_hash: hashedPassword },
    });

    console.log('✅ Superadmin password re-hashed successfully.');

    // Verify it works
    const verify = await bcrypt.compare(SUPERADMIN_PASSWORD, hashedPassword);
    console.log(`🔐 Verification: ${verify ? 'PASS' : 'FAIL'}`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error('❌ Error:', error);
  process.exit(1);
});