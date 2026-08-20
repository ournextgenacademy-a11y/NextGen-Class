import { generateSeedData } from './seeds';

async function main() {
  console.log('Seeding NextGen Class foundational data...');
  const seedData = await generateSeedData();
  console.log(`Generated ${seedData.users.length} users:`);
  seedData.users.forEach(u => console.log(`  • ${u.role}: ${u.email}`));
  console.log(`Generated ${seedData.programmes.length} programmes, ${seedData.cohorts.length} cohorts.`);
  console.log(`Generated ${seedData.applicationForms.length} application forms with dynamic sections and fields.`);
  console.log(`Generated ${seedData.assessments.length} screening assessments.`);
  console.log('Seed completed successfully.');
}

main().catch(err => {
  console.error('Seed execution error:', err);
  process.exit(1);
});
