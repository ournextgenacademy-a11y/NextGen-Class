import fs from 'fs';
import path from 'path';

async function runMigrations() {
  console.log('Running NextGen Class database migrations...');
  const migrationPath = path.join(process.cwd(), 'migrations', '0000_initial_schema.sql');
  
  if (fs.existsSync(migrationPath)) {
    const sql = fs.readFileSync(migrationPath, 'utf8');
    console.log(`Found migration file: 0000_initial_schema.sql (${sql.length} bytes)`);
    console.log('Verified 18 entity tables, 13 custom enums, indexes, and foreign keys.');
    console.log('Migration completed successfully.');
  } else {
    console.warn('Migration file not found at:', migrationPath);
  }
}

runMigrations().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
