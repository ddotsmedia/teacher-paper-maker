import { PrismaClient, DocumentStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const email = 'demo@teacherpaper.local';
  const passwordHash = await bcrypt.hash('Password1', 10);

  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      email,
      name: 'Demo Teacher',
      passwordHash,
      emailVerified: new Date(),
      profile: {
        create: {
          schoolName: 'Demo International School',
          preferredCurriculum: 'CBSE',
          preferredGrades: ['5', '6', '7'],
          preferredSubjects: ['English', 'Mathematics', 'Science'],
        },
      },
    },
  });

  const existing = await prisma.document.count({ where: { userId: user.id } });
  if (existing === 0) {
    await prisma.document.createMany({
      data: [
        {
          userId: user.id,
          title: 'Fractions Practice — Grade 5',
          curriculum: 'CBSE',
          grade: '5',
          subject: 'Mathematics',
          status: DocumentStatus.READY,
        },
        {
          userId: user.id,
          title: 'Reading Comprehension — Grade 6',
          curriculum: 'CBSE',
          grade: '6',
          subject: 'English',
          status: DocumentStatus.DRAFT,
        },
      ],
    });
  }

  // eslint-disable-next-line no-console
  console.log(`Seeded user ${user.email}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
