// // prisma/seed.ts

// import { PrismaClient } from "@prisma/client";


// const prisma = new PrismaClient();

// async function main() {
//   // Clear existing data (optional)
//   await prisma.user.deleteMany();

//   // Seed new data
//   const adminUser = await prisma.user.create({
//     data: {
//       email: 'admin@admin.com',
//       role: "ADMIN",
//       department: 'Administration',
//       faculty: 'Faculty of Arts',
//       course: 'Management',
//       fullName: 'Admin',
//     },
//   });

//   const studentUser = await prisma.user.create({
//     data: {
//       email: 'test123',
//       role: "STUDENT",
//       department: 'Computer Science',
//       faculty: 'Faculty of Science',
//       course: 'Software Engineering',
//       fullName: 'Test Student',

//     },
//   });

//   console.log({ adminUser, studentUser });
// }

// main()
//   .catch((e) => {
//     console.error(e);
//     process.exit(1);
//   })
//   .finally(async () => {
//     await prisma.$disconnect();
//   });
