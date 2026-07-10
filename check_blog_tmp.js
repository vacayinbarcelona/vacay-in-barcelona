const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const tables = await prisma.$queryRawUnsafe(
      "SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_name IN ('BlogPost','NewsletterSubscriber')"
    );
    console.log('Tables found:', JSON.stringify(tables));

    if (tables.length > 0) {
      const count = await prisma.blogPost.count();
      console.log('BlogPost row count:', count);
      if (count > 0) {
        const posts = await prisma.blogPost.findMany({ select: { slug: true, status: true } });
        console.log('Posts:', JSON.stringify(posts));
      }
    }
  } catch (err) {
    console.error('ERROR:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
