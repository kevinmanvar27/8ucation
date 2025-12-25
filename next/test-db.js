const { PrismaClient } = require('@prisma/client');

// Set environment variable
process.env.DATABASE_URL = 'mysql://root:@localhost:3306/school_next';

const prisma = new PrismaClient();

async function main() {
  try {
    // Test database connection by fetching schools
    const schools = await prisma.school.findMany();
    console.log('Schools in database:', schools);

    // Test fetching roles
    const roles = await prisma.role.findMany();
    console.log('Roles in database:', roles.length);

    // Test fetching permissions
    const permissions = await prisma.permission.findMany();
    console.log('Permissions in database:', permissions.length);

    console.log('✅ Database connection and data verification successful!');
  } catch (error) {
    console.error('❌ Database connection or data verification failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();