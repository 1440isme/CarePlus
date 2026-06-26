const elasticClient = require('./elastic.client');
const prisma = require('../database/prisma.client');

async function reindexAll() {
  console.log('🔄 Starting full reindex from MySQL to Elasticsearch...');

  try {
    // 1. Check Elasticsearch Connection
    try {
      await elasticClient.ping();
      console.log('✅ Connected to Elasticsearch');
    } catch (e) {
      console.error('❌ Cannot connect to Elasticsearch. Make sure it is running. Error:', e.message);
      process.exit(1);
    }

    // 2. Define Indices and Mappings
    const indicesConfig = {
      doctors: {
        mappings: {
          properties: {
            displayName: { type: 'text', analyzer: 'standard' },
            name: { type: 'text', analyzer: 'standard' },
            specialtyId: { type: 'keyword' },
            specialtyName: { type: 'text', analyzer: 'standard' },
            description: { type: 'text', analyzer: 'standard' },
            title: { type: 'text', analyzer: 'standard' },
            position: { type: 'text', analyzer: 'standard' },
            experience: { type: 'integer' },
            price: { type: 'double' },
            rating: { type: 'double' },
            active: { type: 'boolean' }
          }
        }
      },
      blogs: {
        mappings: {
          properties: {
            title: { type: 'text', analyzer: 'standard' },
            content: { type: 'text', analyzer: 'standard' },
            tags: { type: 'text', analyzer: 'standard' },
            summary: { type: 'text', analyzer: 'standard' },
            status: { type: 'keyword' }
          }
        }
      },
      specialties: {
        mappings: {
          properties: {
            name: { type: 'text', analyzer: 'standard' },
            description: { type: 'text', analyzer: 'standard' },
            slug: { type: 'keyword' },
            active: { type: 'boolean' }
          }
        }
      }
    };

    for (const [indexName, config] of Object.entries(indicesConfig)) {
      // Delete index if it exists
      const exists = await elasticClient.indices.exists({ index: indexName });
      if (exists) {
        console.log(`🗑️ Deleting old index: ${indexName}`);
        await elasticClient.indices.delete({ index: indexName });
      }

      // Create new index
      console.log(`🏗️ Creating index: ${indexName}`);
      await elasticClient.indices.create({
        index: indexName,
        mappings: config.mappings
      });
    }

    // 3. Reindex Doctors
    console.log('📖 Fetching doctors from MySQL...');
    const doctors = await prisma.doctor.findMany();
    console.log(`Indexing ${doctors.length} doctors...`);
    for (const doc of doctors) {
      await elasticClient.index({
        index: 'doctors',
        id: doc.id,
        document: {
          displayName: [doc.title, doc.name].filter(Boolean).join(' ').trim(),
          name: doc.name,
          specialtyId: doc.specialtyId,
          specialtyName: doc.specialtyName,
          description: doc.description,
          title: doc.title,
          position: doc.position,
          experience: doc.experience,
          price: doc.price,
          rating: doc.rating,
          active: doc.active
        }
      });
    }
    console.log('✅ Doctors reindexed successfully');

    // 4. Reindex Blogs
    console.log('📖 Fetching blog posts from MySQL...');
    const blogs = await prisma.blogPost.findMany();
    console.log(`Indexing ${blogs.length} blogs...`);
    for (const blog of blogs) {
      await elasticClient.index({
        index: 'blogs',
        id: blog.id,
        document: {
          title: blog.title,
          content: blog.content,
          tags: blog.tags,
          summary: blog.summary,
          status: blog.status.toLowerCase()
        }
      });
    }
    console.log('✅ Blogs reindexed successfully');

    // 5. Reindex Specialties
    console.log('📖 Fetching specialties from MySQL...');
    const specialties = await prisma.specialty.findMany();
    console.log(`Indexing ${specialties.length} specialties...`);
    for (const spec of specialties) {
      await elasticClient.index({
        index: 'specialties',
        id: spec.id,
        document: {
          name: spec.name,
          description: spec.description,
          slug: spec.slug,
          active: spec.active
        }
      });
    }
    console.log('✅ Specialties reindexed successfully');

    console.log('🎉 Full reindex completed successfully!');
  } catch (error) {
    console.error('❌ Critical error during reindexing:', error);
  } finally {
    await prisma.$disconnect();
  }
}

reindexAll();
