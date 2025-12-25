const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

// Set environment variable
process.env.DATABASE_URL = 'mysql://root:@localhost:3306/school_next';

const prisma = new PrismaClient();

async function createSecondSchoolUser() {
  try {
    // Get the super admin role for the second school
    const superAdminRole = await prisma.role.findFirst({
      where: {
        schoolId: 2,
        slug: 'super-admin'
      }
    });
    
    if (!superAdminRole) {
      console.log('Super admin role not found for second school');
      return;
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash('admin123', 12);
    
    // Create user
    const user = await prisma.user.create({
      data: {
        schoolId: 2,
        roleId: superAdminRole.id,
        username: 'admin2',
        email: 'admin@secondschool.com',
        password: hashedPassword,
        userType: 'superadmin',
        isActive: true,
      }
    });
    console.log('Created user for second school:', user);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createSecondSchoolUser();