const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

// Set environment variable
process.env.DATABASE_URL = 'mysql://root:@localhost:3306/school_next';

const prisma = new PrismaClient();

// Helper function to generate slug from name
const slugify = (name) => name.toLowerCase().replace(/\s+/g, '-');

async function setupSecondSchool() {
  try {
    console.log('Setting up second school...');
    
    // Get the second school
    const school = await prisma.school.findUnique({
      where: { id: 2 }
    });
    
    if (!school) {
      console.log('Second school not found');
      return;
    }
    
    console.log('Found school:', school.name);
    
    // Create permissions (reuse existing ones)
    const permissions = await prisma.permission.findMany();
    console.log('Found', permissions.length, 'permissions');
    
    // Create roles for second school
    const superAdminRole = await prisma.role.create({
      data: {
        schoolId: school.id,
        name: 'Super Admin',
        slug: slugify('Super Admin'),
        isSystem: true,
      },
    });
    
    const adminRole = await prisma.role.create({
      data: {
        schoolId: school.id,
        name: 'Admin',
        slug: slugify('Admin'),
        isSystem: true,
      },
    });
    
    const teacherRole = await prisma.role.create({
      data: {
        schoolId: school.id,
        name: 'Teacher',
        slug: slugify('Teacher'),
        isSystem: true,
      },
    });
    
    const studentRole = await prisma.role.create({
      data: {
        schoolId: school.id,
        name: 'Student',
        slug: slugify('Student'),
        isSystem: true,
      },
    });
    
    const parentRole = await prisma.role.create({
      data: {
        schoolId: school.id,
        name: 'Parent',
        slug: slugify('Parent'),
        isSystem: true,
      },
    });
    
    const accountantRole = await prisma.role.create({
      data: {
        schoolId: school.id,
        name: 'Accountant',
        slug: slugify('Accountant'),
        isSystem: true,
      },
    });
    
    const librarianRole = await prisma.role.create({
      data: {
        schoolId: school.id,
        name: 'Librarian',
        slug: slugify('Librarian'),
        isSystem: true,
      },
    });
    
    console.log('✅ Created roles for second school');
    
    // Assign all permissions to Super Admin and Admin
    for (const permission of permissions) {
      await prisma.rolePermission.create({
        data: {
          roleId: superAdminRole.id,
          permissionId: permission.id,
        },
      });
      
      await prisma.rolePermission.create({
        data: {
          roleId: adminRole.id,
          permissionId: permission.id,
        },
      });
    }
    console.log('✅ Assigned permissions to roles');
    
    // Create default admin user
    const hashedPassword = await bcrypt.hash('admin123', 12);
    
    const adminUser = await prisma.user.create({
      data: {
        schoolId: school.id,
        roleId: superAdminRole.id,
        username: 'admin2',
        email: 'admin@secondschool.com',
        password: hashedPassword,
        userType: 'superadmin',
        isActive: true,
      },
    });
    console.log('✅ Created admin user for second school:', adminUser.email);
    
    // Create sample classes for second school
    const classNames = ['Nursery', 'LKG', 'UKG', 'Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5', 'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10'];
    
    for (let i = 0; i < classNames.length; i++) {
      await prisma.class.create({
        data: {
          schoolId: school.id,
          className: classNames[i],
          sortOrder: i + 1,
          isActive: true,
        },
      });
    }
    console.log('✅ Created classes for second school');
    
    // Create sample sections for second school
    const sectionNames = ['A', 'B', 'C', 'D'];
    
    for (const sectionName of sectionNames) {
      await prisma.section.create({
        data: {
          schoolId: school.id,
          sectionName,
          isActive: true,
        },
      });
    }
    console.log('✅ Created sections for second school');
    
    console.log('\n🎉 Second school setup completed successfully!');
    console.log('\n📝 Login credentials for second school:');
    console.log('   Email: admin@secondschool.com');
    console.log('   Password: admin123');
    
  } catch (error) {
    console.error('❌ Setup failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

setupSecondSchool();