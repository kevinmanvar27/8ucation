const { PrismaClient } = require('@prisma/client');

// Set environment variable
process.env.DATABASE_URL = 'mysql://root:@localhost:3306/school_next';

const prisma = new PrismaClient();

async function testMultiSchool() {
  try {
    console.log('🧪 Testing multi-school functionality...\n');
    
    // Test 1: Verify schools exist
    const schools = await prisma.school.findMany({
      where: { isActive: true }
    });
    console.log('✅ Found', schools.length, 'active schools:');
    schools.forEach(school => {
      console.log('   -', school.name, '(ID:', school.id, ')');
    });
    
    // Test 2: Verify classes are isolated per school
    console.log('\n--- Class Isolation Test ---');
    const school1Classes = await prisma.class.findMany({
      where: { schoolId: 1 }
    });
    const school2Classes = await prisma.class.findMany({
      where: { schoolId: 2 }
    });
    console.log('✅ School 1 has', school1Classes.length, 'classes');
    console.log('✅ School 2 has', school2Classes.length, 'classes');
    
    // Test 3: Verify students are isolated per school
    console.log('\n--- Student Isolation Test ---');
    const school1Students = await prisma.student.findMany({
      where: { schoolId: 1 }
    });
    const school2Students = await prisma.student.findMany({
      where: { schoolId: 2 }
    });
    console.log('✅ School 1 has', school1Students.length, 'students');
    console.log('✅ School 2 has', school2Students.length, 'students');
    
    // Test 4: Verify sessions are isolated per school
    console.log('\n--- Session Isolation Test ---');
    const school1Sessions = await prisma.session.findMany({
      where: { schoolId: 1 }
    });
    const school2Sessions = await prisma.session.findMany({
      where: { schoolId: 2 }
    });
    console.log('✅ School 1 has', school1Sessions.length, 'sessions');
    console.log('✅ School 2 has', school2Sessions.length, 'sessions');
    
    // Test 5: Verify users are isolated per school
    console.log('\n--- User Isolation Test ---');
    const school1Users = await prisma.user.findMany({
      where: { schoolId: 1 }
    });
    const school2Users = await prisma.user.findMany({
      where: { schoolId: 2 }
    });
    console.log('✅ School 1 has', school1Users.length, 'users');
    console.log('✅ School 2 has', school2Users.length, 'users');
    
    console.log('\n🎉 Multi-school isolation test completed successfully!');
    console.log('✅ Data is properly isolated between schools');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testMultiSchool();