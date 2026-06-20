const prisma = require('../infrastructure/database/prisma.client');
const elasticClient = require('../infrastructure/search/elastic.client');

async function reindex() {
  console.log('Starting bulk reindexing to Elasticsearch...');

  try {
    // 1. Verify DB and ES Connection
    await prisma.$connect();
    console.log('Connected to MySQL database.');

    const esHealthy = await elasticClient.ping();
    if (!esHealthy) {
      throw new Error('Could not ping Elasticsearch server.');
    }
    console.log('Connected to Elasticsearch.');

    // 2. Recreate Indices
    const indicesToRecreate = ['doctors', 'blogs'];

    for (const index of indicesToRecreate) {
      const exists = await elasticClient.indices.exists({ index });
      if (exists) {
        console.log(`Deleting existing index: ${index}...`);
        await elasticClient.indices.delete({ index });
      }
      console.log(`Creating index: ${index}...`);
      await elasticClient.indices.create({ index });
    }

    // 3. Fetch and Bulk Index Doctors
    console.log('Fetching doctors from database...');
    const doctors = await prisma.doctor.findMany({
      where: { active: true },
      include: {
        user: { select: { name: true } },
        specialty: { select: { name: true } }
      }
    });

    if (doctors.length > 0) {
      console.log(`Indexing ${doctors.length} doctors...`);
      const body = doctors.flatMap(doc => [
        { index: { _index: 'doctors', _id: doc.id } },
        {
          userId: doc.userId,
          title: doc.title,
          name: doc.name,
          specialtyId: doc.specialtyId,
          specialtyName: doc.specialtyName,
          experience: doc.experience,
          price: doc.price,
          rating: doc.rating,
          reviewCount: doc.reviewCount,
          avatar: doc.avatar,
          description: doc.description,
          position: doc.position,
          active: doc.active,
          createdAt: doc.createdAt,
          updatedAt: doc.updatedAt
        }
      ]);

      const bulkResponse = await elasticClient.bulk({ refresh: true, operations: body });
      if (bulkResponse.errors) {
        console.error('Errors occurred during doctor bulk index:', bulkResponse.errors);
      } else {
        console.log('Successfully indexed all active doctors.');
      }
    } else {
      console.log('No doctors found in database.');
    }

    // 4. Fetch and Bulk Index BlogPosts
    console.log('Fetching blog posts from database...');
    const blogs = await prisma.blogPost.findMany({
      include: {
        author: { select: { name: true } }
      }
    });

    if (blogs.length > 0) {
      console.log(`Indexing ${blogs.length} blog posts...`);
      const body = blogs.flatMap(blog => [
        { index: { _index: 'blogs', _id: blog.id } },
        {
          title: blog.title,
          slug: blog.slug,
          content: blog.content,
          summary: blog.summary,
          thumbnail: blog.thumbnail,
          status: blog.status.toLowerCase(),
          tags: blog.tags,
          authorId: blog.authorId,
          createdAt: blog.createdAt,
          updatedAt: blog.updatedAt
        }
      ]);

      const bulkResponse = await elasticClient.bulk({ refresh: true, operations: body });
      if (bulkResponse.errors) {
        console.error('Errors occurred during blog bulk index:', bulkResponse.errors);
      } else {
        console.log('Successfully indexed all blog posts.');
      }
    } else {
      console.log('No blog posts found in database.');
    }

    console.log('Reindexing completed successfully!');
  } catch (error) {
    console.error('Reindexing failed with error:', error);
  } finally {
    await prisma.$disconnect();
    process.exit(0);
  }
}

reindex();
