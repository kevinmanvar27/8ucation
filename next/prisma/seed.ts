import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Helper function to generate slug from name
const slugify = (name: string): string => name.toLowerCase().replace(/\s+/g, '-');

async function main() {
  console.log('🌱 Starting database seed...');

  // Create default school
  const school = await prisma.schools.upsert({
    where: { code: 'DEMO' },
    update: {},
    create: {
      name: 'Demo School',
      code: 'DEMO',
      email: 'admin@demoschool.com',
      phone: '+1234567890',
      address: '123 Education Street',
      city: 'Education City',
      state: 'ED',
      country: 'USA',
      pincode: '12345',
      currencyCode: 'USD',
      currencySymbol: '$',
      dateFormat: 'MM/DD/YYYY',
      timezone: 'America/New_York',
      isActive: true,
    },
  });
  console.log('✅ Created school:', school.name);

  // Create permissions
  const permissionNames = [
    'students.view', 'students.create', 'students.edit', 'students.delete',
    'parents.view', 'parents.create', 'parents.edit', 'parents.delete',
    'staff.view', 'staff.create', 'staff.edit', 'staff.delete',
    'academics.view', 'academics.create', 'academics.edit', 'academics.delete',
    'attendance.view', 'attendance.create', 'attendance.edit', 'attendance.delete',
    'exams.view', 'exams.create', 'exams.edit', 'exams.delete',
    'online_exams.view', 'online_exams.create', 'online_exams.edit', 'online_exams.delete',
    'homework.view', 'homework.create', 'homework.edit', 'homework.delete',
    'fees.view', 'fees.create', 'fees.edit', 'fees.delete',
    'finance.view', 'finance.create', 'finance.edit', 'finance.delete',
    'transport.view', 'transport.create', 'transport.edit', 'transport.delete',
    'hostel.view', 'hostel.create', 'hostel.edit', 'hostel.delete',
    'library.view', 'library.create', 'library.edit', 'library.delete',
    'inventory.view', 'inventory.create', 'inventory.edit', 'inventory.delete',
    'front_office.view', 'front_office.create', 'front_office.edit', 'front_office.delete',
    'events.view', 'events.create', 'events.edit', 'events.delete',
    'reports.view', 'reports.export',
    'settings.view', 'settings.edit',
    'cms.view', 'cms.create', 'cms.edit', 'cms.delete',
  ];

  const permissions = await Promise.all(
    permissionNames.map((name) => {
      const [module, action] = name.split('.');
      const slug = name.replace(/\./g, '_');
      return prisma.permissions.upsert({
        where: { slug },
        update: {},
        create: {
          name: name.replace(/[._]/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
          slug,
          module,
        },
      });
    })
  );
  console.log('✅ Created', permissions.length, 'permissions');

  // Create roles
  const superAdminRole = await prisma.roles.upsert({
    where: { schoolId_slug: { schoolId: school.id, slug: slugify('Super Admin') } },
    update: {},
    create: {
      schoolId: school.id,
      name: 'Super Admin',
      slug: slugify('Super Admin'),
      isSystem: true,
    },
  });

  const adminRole = await prisma.roles.upsert({
    where: { schoolId_slug: { schoolId: school.id, slug: slugify('Admin') } },
    update: {},
    create: {
      schoolId: school.id,
      name: 'Admin',
      slug: slugify('Admin'),
      isSystem: true,
    },
  });

  const teacherRole = await prisma.roles.upsert({
    where: { schoolId_slug: { schoolId: school.id, slug: slugify('Teacher') } },
    update: {},
    create: {
      schoolId: school.id,
      name: 'Teacher',
      slug: slugify('Teacher'),
      isSystem: true,
    },
  });

  const studentRole = await prisma.roles.upsert({
    where: { schoolId_slug: { schoolId: school.id, slug: slugify('Student') } },
    update: {},
    create: {
      schoolId: school.id,
      name: 'Student',
      slug: slugify('Student'),
      isSystem: true,
    },
  });

  const parentRole = await prisma.roles.upsert({
    where: { schoolId_slug: { schoolId: school.id, slug: slugify('Parent') } },
    update: {},
    create: {
      schoolId: school.id,
      name: 'Parent',
      slug: slugify('Parent'),
      isSystem: true,
    },
  });

  const accountantRole = await prisma.roles.upsert({
    where: { schoolId_slug: { schoolId: school.id, slug: slugify('Accountant') } },
    update: {},
    create: {
      schoolId: school.id,
      name: 'Accountant',
      slug: slugify('Accountant'),
      isSystem: true,
    },
  });

  const librarianRole = await prisma.roles.upsert({
    where: { schoolId_slug: { schoolId: school.id, slug: slugify('Librarian') } },
    update: {},
    create: {
      schoolId: school.id,
      name: 'Librarian',
      slug: slugify('Librarian'),
      isSystem: true,
    },
  });

  console.log('✅ Created roles');

  // Assign all permissions to Super Admin and Admin
  for (const permission of permissions) {
    await prisma.role_permissions.upsert({
      where: {
        roleId_permissionId: { roleId: superAdminRole.id, permissionId: permission.id },
      },
      update: {},
      create: {
        roleId: superAdminRole.id,
        permissionId: permission.id,
      },
    });

    await prisma.role_permissions.upsert({
      where: {
        roleId_permissionId: { roleId: adminRole.id, permissionId: permission.id },
      },
      update: {},
      create: {
        roleId: adminRole.id,
        permissionId: permission.id,
      },
    });
  }
  console.log('✅ Assigned permissions to roles');

  // Create default admin user
  const hashedPassword = await bcrypt.hash('admin123', 12);
  
  const adminUser = await prisma.users.upsert({
    where: { schoolId_email: { schoolId: school.id, email: 'admin@demoschool.com' } },
    update: {},
    create: {
      schoolId: school.id,
      roleId: superAdminRole.id,
      username: 'admin',
      email: 'admin@demoschool.com',
      password: hashedPassword,
      userType: 'superadmin',
      isActive: true,
    },
  });
  console.log('✅ Created admin user:', adminUser.email);

  // Create academic session
  const currentYear = new Date().getFullYear();
  const sessionRecord = await prisma.sessions.upsert({
    where: { schoolId_session: { schoolId: school.id, session: `${currentYear}-${currentYear + 1}` } },
    update: {},
    create: {
      schoolId: school.id,
      session: `${currentYear}-${currentYear + 1}`,
      startDate: new Date(`${currentYear}-04-01`),
      endDate: new Date(`${currentYear + 1}-03-31`),
      isActive: true,
    },
  });
  console.log('✅ Created session:', sessionRecord.session);

  // Create sample classes
  const classNames = ['Nursery', 'LKG', 'UKG', 'Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5', 'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10'];
  
  for (let i = 0; i < classNames.length; i++) {
    await prisma.classes.upsert({
      where: { schoolId_className: { schoolId: school.id, className: classNames[i] } },
      update: {},
      create: {
        schoolId: school.id,
        className: classNames[i],
        sortOrder: i + 1,
        isActive: true,
      },
    });
  }
  console.log('✅ Created', classNames.length, 'classes');

  // Create sample sections
  const sectionNames = ['A', 'B', 'C', 'D'];
  
  for (const sectionName of sectionNames) {
    await prisma.sections.upsert({
      where: { schoolId_sectionName: { schoolId: school.id, sectionName } },
      update: {},
      create: {
        schoolId: school.id,
        sectionName,
        isActive: true,
      },
    });
  }
  console.log('✅ Created', sectionNames.length, 'sections');

  // Create sample subjects
  const subjectNames = [
    'English', 'Mathematics', 'Science', 'Social Studies', 'Hindi',
    'Computer Science', 'Physical Education', 'Art', 'Music', 'Environmental Studies',
  ];
  
  for (const subjectName of subjectNames) {
    await prisma.subjects.upsert({
      where: { schoolId_name: { schoolId: school.id, name: subjectName } },
      update: {},
      create: {
        schoolId: school.id,
        name: subjectName,
        code: subjectName.substring(0, 3).toUpperCase(),
        type: 'theory',
        isActive: true,
      },
    });
  }
  console.log('✅ Created', subjectNames.length, 'subjects');

  // Create departments
  const departmentNames = ['Administration', 'Teaching', 'Accounts', 'Library', 'Transport', 'Maintenance'];
  
  for (const deptName of departmentNames) {
    await prisma.departments.upsert({
      where: { schoolId_name: { schoolId: school.id, name: deptName } },
      update: {},
      create: {
        schoolId: school.id,
        name: deptName,
        isActive: true,
      },
    });
  }
  console.log('✅ Created', departmentNames.length, 'departments');

  // Create designations
  const designationNames = ['Principal', 'Vice Principal', 'Senior Teacher', 'Teacher', 'Clerk', 'Accountant', 'Librarian', 'Driver', 'Peon'];
  
  for (const desigName of designationNames) {
    await prisma.designations.upsert({
      where: { schoolId_name: { schoolId: school.id, name: desigName } },
      update: {},
      create: {
        schoolId: school.id,
        name: desigName,
        isActive: true,
      },
    });
  }
  console.log('✅ Created', designationNames.length, 'designations');

  // Create fee types
  const feeTypes = [
    { name: 'Tuition Fee', code: 'TF', description: 'Monthly tuition fee' },
    { name: 'Admission Fee', code: 'AF', description: 'One-time admission fee' },
    { name: 'Transport Fee', code: 'TRF', description: 'School bus fee' },
    { name: 'Library Fee', code: 'LF', description: 'Library access fee' },
    { name: 'Lab Fee', code: 'LAB', description: 'Laboratory usage fee' },
    { name: 'Sports Fee', code: 'SF', description: 'Sports and games fee' },
    { name: 'Exam Fee', code: 'EF', description: 'Examination fee' },
  ];
  
  for (const ft of feeTypes) {
    await prisma.fee_types.upsert({
      where: { schoolId_name: { schoolId: school.id, name: ft.name } },
      update: {},
      create: {
        schoolId: school.id,
        ...ft,
        isActive: true,
      },
    });
  }
  console.log('✅ Created', feeTypes.length, 'fee types');

  // Create grades
  const grades = [
    { name: 'A+', minPercentage: 90, maxPercentage: 100, gradePoint: 9.99, description: 'Outstanding' },
    { name: 'A', minPercentage: 80, maxPercentage: 89.99, gradePoint: 8.99, description: 'Excellent' },
    { name: 'B+', minPercentage: 70, maxPercentage: 79.99, gradePoint: 7.99, description: 'Very Good' },
    { name: 'B', minPercentage: 60, maxPercentage: 69.99, gradePoint: 6.99, description: 'Good' },
    { name: 'C+', minPercentage: 50, maxPercentage: 59.99, gradePoint: 5.99, description: 'Above Average' },
    { name: 'C', minPercentage: 40, maxPercentage: 49.99, gradePoint: 4.99, description: 'Average' },
    { name: 'D', minPercentage: 33, maxPercentage: 39.99, gradePoint: 3.99, description: 'Below Average' },
    { name: 'F', minPercentage: 0, maxPercentage: 32.99, gradePoint: 0.00, description: 'Fail' },
  ];
  
  for (const gradeData of grades) {
    await prisma.grades.upsert({
      where: { schoolId_name: { schoolId: school.id, name: gradeData.name } },
      update: {},
      create: {
        schoolId: school.id,
        ...gradeData,
        isActive: true,
      },
    });
  }
  console.log('✅ Created', grades.length, 'grades');

  // Create leave types
  const leaveTypes = [
    { name: 'Casual Leave' },
    { name: 'Sick Leave' },
    { name: 'Earned Leave' },
    { name: 'Maternity Leave' },
    { name: 'Paternity Leave' },
  ];
  
  for (const lt of leaveTypes) {
    await prisma.leave_types.upsert({
      where: { schoolId_name: { schoolId: school.id, name: lt.name } },
      update: {},
      create: {
        schoolId: school.id,
        ...lt,
        isActive: true,
      },
    });
  }
  console.log('✅ Created', leaveTypes.length, 'leave types');

  // Create content types
  const contentTypes = ['Assignments', 'Study Material', 'Syllabus', 'Other Downloads'];
  
  for (const ctName of contentTypes) {
    await prisma.content_types.upsert({
      where: { schoolId_name: { schoolId: school.id, name: ctName } },
      update: {},
      create: {
        schoolId: school.id,
        name: ctName,
        isActive: true,
      },
    });
  }
  console.log('✅ Created', contentTypes.length, 'content types');

  // Create income heads
  const incomeHeads = ['Fee Collection', 'Donations', 'Grants', 'Interest', 'Other Income'];
  
  for (const ihName of incomeHeads) {
    await prisma.income_heads.upsert({
      where: { schoolId_name: { schoolId: school.id, name: ihName } },
      update: {},
      create: {
        schoolId: school.id,
        name: ihName,
        isActive: true,
      },
    });
  }
  console.log('✅ Created', incomeHeads.length, 'income heads');

  // Create expense heads
  const expenseHeads = ['Salary', 'Utilities', 'Maintenance', 'Stationery', 'Transport', 'Events', 'Other Expenses'];
  
  for (const ehName of expenseHeads) {
    await prisma.expense_heads.upsert({
      where: { schoolId_name: { schoolId: school.id, name: ehName } },
      update: {},
      create: {
        schoolId: school.id,
        name: ehName,
        isActive: true,
      },
    });
  }
  console.log('✅ Created', expenseHeads.length, 'expense heads');

  console.log('\n🎉 Database seeding completed successfully!');
  console.log('\n📝 Login credentials:');
  console.log('   Email: admin@demoschool.com');
  console.log('   Password: admin123');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
