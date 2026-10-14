#!/usr/bin/env node
/**
 * CLI seed script — run: node scripts/seed.mjs
 * Seeds the in-memory or MongoDB database with demo data.
 */

import { seed } from '../lib/seed.js';

async function main() {
  console.log('🌱 Seeding database…');
  await seed(true);
  console.log('✅ Seed complete.');
  process.exit(0);
}

main().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});

