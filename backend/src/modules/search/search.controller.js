const SearchService = require('./search.service');
const { z } = require('zod');

const searchQuerySchema = z.object({
  query: z.string().trim().min(1, 'Query must not be empty'),
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
}).strict();

class SearchController {
  /**
   * Search doctors and blogs concurrently.
   * GET /api/v1/search
   */
  async search(req, res, next) {
    try {
      const parsedQuery = searchQuerySchema.safeParse(req.query || {});
      if (!parsedQuery.success) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Query parameter is required',
            details: parsedQuery.error.issues.map(issue => ({
              field: issue.path.join('.'),
              message: issue.message
            }))
          }
        });
      }

      const { query, page = 1, limit = 10 } = parsedQuery.data;

      // Run search on Doctors and Blogs concurrently
      const [doctorsResult, blogsResult] = await Promise.all([
        SearchService.searchDoctors({ query, page, limit }),
        SearchService.searchBlogs({ query, page, limit })
      ]);

      return res.status(200).json({
        success: true,
        data: {
          doctors: doctorsResult.data || [],
          blogs: blogsResult.data || []
        },
        meta: {
          query,
          doctorsCount: doctorsResult.meta?.total || 0,
          blogsCount: blogsResult.meta?.total || 0
        }
      });
    } catch (error) {
      return next(error);
    }
  }
}

module.exports = new SearchController();
