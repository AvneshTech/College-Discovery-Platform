// prisma/seed.js
// Minimal seed so the predictor + cards have data to render in development.
// Run with:  npm run db:seed
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  const adminPassword = await bcrypt.hash("Admin@123", 12);
  const admin = await prisma.user.upsert({
    where: { email: "admin@collegeedge.dev" },
    update: {},
    create: { name: "Platform Admin", email: "admin@collegeedge.dev", password: adminPassword, role: "ADMIN" },
  });

  const colleges = [
    {
      name: "Indian Institute of Technology Bombay",
      slug: "iit-bombay",
      city: "Mumbai", state: "Maharashtra", type: "Government",
      rating: 4.8, reviewCount: 0, nirfRank: 3, naacGrade: "A++",
      fees: 220000, feesDisplay: "₹2.2L / yr", avgPackage: 2100000, highestPackage: 35000000, placementRate: 95,
      courses: ["B.Tech", "M.Tech", "MBA"], branches: ["CSE", "ECE", "Mechanical", "Civil"],
      overview: "One of India's premier engineering institutions.", website: "https://www.iitb.ac.in", established: 1958,
      cutoffs: { create: [{ exam: "JEE Advanced", branch: "CSE", category: "General", year: 2024, closingRank: 66, openingRank: 1 }] },
    },
    {
      name: "Birla Institute of Technology and Science Pilani",
      slug: "bits-pilani",
      city: "Pilani", state: "Rajasthan", type: "Private",
      rating: 4.6, reviewCount: 0, nirfRank: 20, naacGrade: "A",
      fees: 480000, feesDisplay: "₹4.8L / yr", avgPackage: 1800000, highestPackage: 25000000, placementRate: 92,
      courses: ["B.E.", "M.E."], branches: ["CSE", "ECE", "EEE", "Mechanical"],
      overview: "Leading private deemed university with a strong placement record.", website: "https://www.bits-pilani.ac.in", established: 1964,
      cutoffs: { create: [{ exam: "BITSAT", branch: "CSE", category: "General", year: 2024, closingRank: 5000, openingRank: 1 }] },
    },
  ];

  for (const c of colleges) {
    await prisma.college.upsert({ where: { slug: c.slug }, update: {}, create: { ...c, createdById: admin.id } });
  }

  // eslint-disable-next-line no-console
  console.log("✅ Seed complete. Admin login: admin@collegeedge.dev / Admin@123");
}

main()
  .catch((e) => {
    // eslint-disable-next-line no-console
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
