import { PrismaClient, JobStatus, SubscriptionTier, ApplicationSource } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@jobpilot.ai' },
    update: {},
    create: {
      email: 'admin@jobpilot.ai',
      passwordHash: adminPassword,
      firstName: 'Admin',
      lastName: 'User',
      title: 'Platform Administrator',
      targetRole: 'Engineering Manager',
      experienceLevel: 'Senior',
      targetLocations: 'Remote, Canada',
      isActive: true,
      subscription: {
        create: {
          tier: SubscriptionTier.PRO,
        },
      },
    },
  });
  console.log(`Created admin user: ${admin.email}`);

  // Create demo user
  const userPassword = await bcrypt.hash('demo1234', 12);
  const demoUser = await prisma.user.upsert({
    where: { email: 'demo@jobpilot.ai' },
    update: {},
    create: {
      email: 'demo@jobpilot.ai',
      passwordHash: userPassword,
      firstName: 'Demo',
      lastName: 'User',
      title: 'Senior Software Engineer',
      targetRole: 'Staff Software Engineer',
      experienceLevel: 'Senior',
      targetLocations: 'Toronto, Vancouver, Remote',
      isActive: true,
      subscription: {
        create: {
          tier: SubscriptionTier.FREE,
        },
      },
    },
  });
  console.log(`Created demo user: ${demoUser.email}`);

  // Create sample job applications
  const sampleJobs = [
    {
      companyName: 'Shopify',
      companyWebsite: 'https://shopify.com',
      jobTitle: 'Senior Backend Developer',
      jobUrl: 'https://shopify.com/careers/123',
      jobDescription: 'Build the future of commerce. We are looking for a Senior Backend Developer to join our Platform team.',
      location: 'Ottawa, ON (Remote)',
      salaryRange: '$150k - $200k CAD',
      employmentType: 'Full-time',
      workMode: 'Remote',
      status: JobStatus.APPLIED,
      source: ApplicationSource.MANUAL,
      appliedAt: new Date('2026-06-15'),
      notes: 'Completed technical assessment, waiting to hear back.',
    },
    {
      companyName: 'Wealthsimple',
      companyWebsite: 'https://wealthsimple.com',
      jobTitle: 'Staff Software Engineer',
      jobUrl: 'https://wealthsimple.com/careers/456',
      jobDescription: 'Help build the future of personal finance in Canada.',
      location: 'Toronto, ON (Hybrid)',
      salaryRange: '$180k - $250k CAD',
      employmentType: 'Full-time',
      workMode: 'Hybrid',
      status: JobStatus.PHONE_SCREEN,
      source: ApplicationSource.LINKEDIN,
      appliedAt: new Date('2026-06-20'),
      notes: 'Phone screen scheduled for next week.',
    },
    {
      companyName: 'Amazon',
      companyWebsite: 'https://amazon.com',
      jobTitle: 'Software Development Engineer II',
      jobUrl: 'https://amazon.jobs/789',
      jobDescription: 'Build large-scale distributed systems for AWS.',
      location: 'Vancouver, BC',
      salaryRange: '$160k - $220k CAD',
      employmentType: 'Full-time',
      workMode: 'On-site',
      status: JobStatus.TECHNICAL,
      source: ApplicationSource.REFERRAL,
      appliedAt: new Date('2026-05-01'),
      notes: 'Had phone screen, scheduled for technical loop in 2 weeks.',
    },
    {
      companyName: 'Interac Corp',
      companyWebsite: 'https://interac.ca',
      jobTitle: 'Senior Full Stack Developer',
      jobUrl: 'https://interac.ca/careers/101',
      jobDescription: 'Build secure payment solutions for Canadians.',
      location: 'Toronto, ON',
      salaryRange: '$130k - $170k CAD',
      employmentType: 'Full-time',
      workMode: 'Hybrid',
      status: JobStatus.OFFER,
      source: ApplicationSource.INDEED,
      appliedAt: new Date('2026-04-10'),
      notes: 'Received offer: $155k base + 10% bonus + benefits. Deadline July 15.',
      offerSalary: 155000,
      offerBenefits: '10% bonus, extended health, RSP matching, 3 weeks vacation',
      offerDeadline: new Date('2026-07-15'),
    },
    {
      companyName: 'Lightspeed Commerce',
      companyWebsite: 'https://lightspeedhq.com',
      jobTitle: 'Senior Frontend Engineer',
      jobUrl: 'https://lightspeedhq.com/careers/202',
      jobDescription: 'Build world-class commerce interfaces using React and TypeScript.',
      location: 'Montreal, QC (Remote)',
      salaryRange: '$140k - $190k CAD',
      employmentType: 'Full-time',
      workMode: 'Remote',
      status: JobStatus.REJECTED,
      source: ApplicationSource.LINKEDIN,
      appliedAt: new Date('2026-03-15'),
      rejectedAt: new Date('2026-04-01'),
      rejectionReason: 'Position filled internally',
    },
  ];

  for (const job of sampleJobs) {
    await prisma.jobApplication.create({
      data: {
        ...job,
        userId: demoUser.id,
      },
    });
  }
  console.log(`Created ${sampleJobs.length} sample job applications`);

  // Create interview questions
  const questions = [
    {
      question: 'Explain the event loop in JavaScript. How does it handle asynchronous operations?',
      type: 'TECHNICAL' as const,
      category: 'JavaScript',
      difficulty: 3,
    },
    {
      question: 'Design a URL shortener service like bit.ly. Discuss the trade-offs.',
      type: 'SYSTEM_DESIGN' as const,
      category: 'System Design',
      difficulty: 4,
    },
    {
      question: 'Tell me about a time you had to deal with a difficult stakeholder. How did you handle it?',
      type: 'BEHAVIORAL' as const,
      category: 'Leadership',
      difficulty: 3,
    },
    {
      question: 'Implement a function to detect a cycle in a linked list.',
      type: 'CODING' as const,
      category: 'Data Structures',
      difficulty: 3,
    },
  ];

  for (const q of questions) {
    await prisma.interviewQuestion.create({
      data: {
        ...q,
        userId: demoUser.id,
      },
    });
  }
  console.log(`Created ${questions.length} interview questions`);

  console.log('Seeding complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
