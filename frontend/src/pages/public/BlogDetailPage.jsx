import { useParams, Link } from 'react-router-dom';
import { ChevronRight, ArrowLeft, BookOpen } from 'lucide-react';
import { usePublicBlogBySlug, usePublicBlogs } from '../../features/blog/index.js';
import BlogCard from '../../features/blog/components/BlogCard.jsx';
import LoadingBlock from '../../shared/components/feedback/LoadingBlock.jsx';
import StateBlock from '../../shared/components/feedback/StateBlock.jsx';

export default function BlogDetailPage() {
  const { slug } = useParams();

  // Fetch blog detail using React Query
  const { data: response, isLoading, isError, error, refetch } = usePublicBlogBySlug(slug);
  const blog = response?.data;

  // Fetch latest blogs for related/latest section
  const { data: latestResponse, isLoading: latestLoading } = usePublicBlogs({
    page: 1,
    limit: 4
  });

  const latestBlogs = (latestResponse?.data ?? [])
    .filter((b) => b.slug !== slug)
    .slice(0, 3);

  // Format date
  const formattedDate = blog?.createdAt 
    ? new Date(blog.createdAt).toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      })
    : '';

  // Get first tag as main category
  const category = blog?.tags && blog.tags.length > 0 ? blog.tags[0] : 'Cẩm nang';

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16">
        <LoadingBlock label="Đang tải bài viết..." />
      </div>
    );
  }

  if (isError || !blog) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16">
        <StateBlock 
          variant="error" 
          title="Không thể tải bài viết" 
          description={error?.message || 'Có lỗi xảy ra trên hệ thống hoặc bài viết không tồn tại.'} 
        />
        <div className="flex gap-3 justify-center mt-6">
          <Link to="/cam-nang" className="px-5 py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors">
            Quay về Cẩm nang
          </Link>
          <button onClick={() => refetch()} className="px-5 py-2.5 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-xl text-xs font-semibold shadow-sm transition-colors">
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-505 text-gray-550 text-gray-500 mb-6">
          <Link to="/" className="hover:text-cyan-600 font-medium">Trang chủ</Link>
          <ChevronRight className="w-4 h-4" />
          <Link to="/cam-nang" className="hover:text-cyan-600 font-medium">Cẩm nang</Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-gray-900 truncate font-semibold">{blog.title}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main article content */}
          <div className="lg:col-span-2 space-y-6 bg-white border border-gray-150 rounded-2xl p-6 md:p-8 shadow-sm">
            <div>
              <Link to="/cam-nang" className="inline-flex items-center gap-1.5 text-xs text-cyan-600 hover:underline font-semibold mb-4">
                <ArrowLeft className="w-4 h-4" />
                Quay về danh sách bài viết
              </Link>
              <div className="mb-3">
                <span className="text-xs text-cyan-600 font-bold bg-cyan-50 px-2.5 py-1 rounded-full">
                  {category}
                </span>
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 leading-tight mb-4">
                {blog.title}
              </h1>
              
              <div className="flex items-center gap-3 border-t border-b border-gray-100 py-3.5 my-4">
                <div className="w-9 h-9 rounded-full bg-cyan-600 text-white flex items-center justify-center text-xs font-bold shadow-sm">
                  {blog.author?.name ? blog.author.name.slice(0, 2).toUpperCase() : 'CP'}
                </div>
                <div className="text-xs text-gray-500">
                  <div className="font-bold text-gray-800">
                    Tác giả: {blog.author?.name || 'Ban biên tập CarePlus'}
                  </div>
                  <div className="mt-0.5">Ngày đăng: {formattedDate}</div>
                </div>
              </div>
            </div>

            {blog.thumbnail && (
              <div className="overflow-hidden rounded-xl h-64 md:h-80 bg-gray-50">
                <img 
                  src={blog.thumbnail} 
                  alt={blog.title} 
                  className="w-full h-full object-cover object-center"
                />
              </div>
            )}

            {blog.summary && (
              <div className="p-4 bg-cyan-50/50 border-l-4 border-cyan-500 rounded-r-xl">
                <p className="text-sm font-medium text-cyan-800 leading-relaxed italic">
                  {blog.summary}
                </p>
              </div>
            )}

            {/* Main html content */}
            <div 
              className="prose max-w-none text-sm text-gray-700 leading-relaxed space-y-4"
              dangerouslySetInnerHTML={{ __html: blog.content }} 
            />

            {/* Footer tags */}
            {blog.tags && blog.tags.length > 0 && (
              <div className="pt-6 border-t border-gray-100 flex flex-wrap items-center gap-2">
                <span className="text-xs text-gray-400 font-bold">Từ khóa:</span>
                {blog.tags.map((tag) => (
                  <Link 
                    to={`/cam-nang?tag=${encodeURIComponent(tag)}`} 
                    key={tag} 
                    className="px-2.5 py-1 bg-gray-100 hover:bg-cyan-50 hover:text-cyan-600 text-gray-600 rounded-lg text-xs font-semibold transition-colors"
                  >
                    #{tag}
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Related Articles sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-6 bg-white border border-gray-150 rounded-2xl p-5 shadow-sm space-y-4">
              <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-cyan-600" />
                Bài viết mới nhất
              </h3>
              
              {latestLoading ? (
                <div className="text-xs text-gray-400">Đang tải bài viết...</div>
              ) : latestBlogs.length === 0 ? (
                <div className="text-xs text-gray-400">Không có bài viết liên quan nào.</div>
              ) : (
                <div className="space-y-4">
                  {latestBlogs.map(r => (
                    <Link
                      key={r.id}
                      to={`/cam-nang/${r.slug}`}
                      className="flex gap-3 bg-white hover:bg-cyan-50/10 rounded-xl p-2 border border-gray-100 hover:border-cyan-200 transition-all group"
                    >
                      <div className="w-16 h-14 bg-cyan-50 rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center text-xl">
                        {r.thumbnail ? (
                          <img src={r.thumbnail} alt={r.title} className="w-full h-full object-cover" />
                        ) : (
                          <span>📖</span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <span className="text-[10px] text-cyan-600 font-semibold">{r.tags && r.tags.length > 0 ? r.tags[0] : 'Cẩm nang'}</span>
                        <p className="text-xs font-bold text-gray-800 line-clamp-2 group-hover:text-cyan-600 transition-colors mt-0.5 leading-snug">
                          {r.title}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
        
      </div>
    </div>
  );
}
