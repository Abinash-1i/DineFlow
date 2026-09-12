const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const dbUrl = process.env.DATABASE_URL || '';
const schemaPath = path.join(__dirname, 'schema.prisma');
const isPostgres = dbUrl.startsWith('postgresql://') || dbUrl.startsWith('postgres://');

try {
  if (fs.existsSync(schemaPath)) {
    let content = fs.readFileSync(schemaPath, 'utf8');
    if (isPostgres) {
      console.log('🔄 Detected PostgreSQL DATABASE_URL. Adjusting Prisma provider to postgresql...');
      content = content.replace(/provider\s*=\s*"sqlite"/g, 'provider = "postgresql"');
      fs.writeFileSync(schemaPath, content, 'utf8');
    } else if (dbUrl.startsWith('file:') || !dbUrl) {
      if (content.includes('provider = "postgresql"')) {
        console.log('📦 Detected SQLite DATABASE_URL. Adjusting Prisma provider to sqlite...');
        content = content.replace(/provider\s*=\s*"postgresql"/g, 'provider = "sqlite"');
        fs.writeFileSync(schemaPath, content, 'utf8');
      }
    }
  }

  // Automatically create/sync tables in cloud PostgreSQL on Vercel
  if (isPostgres && (process.env.VERCEL || process.env.CI)) {
    try {
      console.log('🚀 Syncing PostgreSQL schema tables via prisma db push...');
      execSync('npx prisma db push --accept-data-loss', { stdio: 'inherit' });
    } catch (pushErr) {
      console.warn('⚠️ prisma db push notice:', pushErr.message);
    }
  }

  // Generate Prisma Client
  try {
    execSync('npx prisma generate', { stdio: 'inherit' });
  } catch (genErr) {
    if (process.env.VERCEL || process.env.CI) {
      throw genErr;
    } else {
      console.warn('⚠️ Local prisma generate skipped (file lock from active dev server). Continuing build...');
    }
  }
} catch (err) {
  console.error('Error in prisma/prepare.js:', err.message);
  if (process.env.VERCEL || process.env.CI) {
    process.exit(1);
  }
}
