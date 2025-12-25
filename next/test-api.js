const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testAPI() {
  try {
    // Set environment variable
    process.env.DATABASE_URL = 'mysql://root:@localhost:3306/school_next';
    
    // Test database connection by fetching schools
    const schools = await prisma.school.findMany();
    console.log('✅ Schools:', schools);
    
    // Test fetching sessions for the first school
    if (schools.length > 0) {
      const sessions = await prisma.session.findMany({
        where: { schoolId: schools[0].id },
        orderBy: { createdAt: 'desc' },
      });
      console.log('✅ Sessions:', sessions);
      
      // Test fetching classes
      const classes = await prisma.class.findMany({
        where: { schoolId: schools[0].id },
        orderBy: { sortOrder: 'asc' },
        include: {
          classSections: {
            include: {
              section: true,
            },
            orderBy: { section: { sectionName: 'asc' } },
          },
        },
      });
      console.log('✅ Classes:', classes.length);
      
      // Test fetching students
      const students = await prisma.student.findMany({
        where: { schoolId: schools[0].id },
        take: 5, // Limit to 5 for testing
      });
      console.log('✅ Students:', students.length);
    }
    
  } catch (error) {
    console.error('❌ API test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testAPI();