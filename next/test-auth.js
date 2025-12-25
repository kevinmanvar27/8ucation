const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function testAuth() {
  try {
    // Set environment variable
    process.env.DATABASE_URL = 'mysql://root:@localhost:3306/school_next';
    
    // Test database connection by fetching the admin user
    const user = await prisma.user.findFirst({
      where: {
        email: 'admin@demoschool.com',
      },
      include: {
        school: true,
      },
    });
    
    if (!user) {
      console.log('❌ Admin user not found');
      return;
    }
    
    console.log('✅ Admin user found:', user.email);
    console.log('✅ School:', user.school.name);
    
    // Test password
    const isValid = await bcrypt.compare('admin123', user.password);
    if (isValid) {
      console.log('✅ Password is correct');
    } else {
      console.log('❌ Password is incorrect');
    }
    
  } catch (error) {
    console.error('❌ Authentication test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testAuth();