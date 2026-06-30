import { useState, useEffect } from 'react';
import { usePublicBlogs } from '../../features/blog/index.js';
import BlogCard from '../../features/blog/components/BlogCard.jsx';
import { Search } from 'lucide-react';

const TAG_FILTERS = ['Tất cả', 'Tim mạch', 'Tiêu hóa', 'Nhi khoa', 'Da liễu', 'Cơ Xương Khớp', 'Tai Mũi Họng', 'Sản phụ khoa'];

export default function BlogListPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedTag, setSelectedTag] = useState('Tất cả');
  const [currentPage, setCurrentPage] = useState(1);
  const limit = 6;

  // Debounce search keyword update
  useEffect(() => {
    const handler = setTimeout(() => {
      setSearchKeyword(searchQuery.trim());
      setCurrentPage(1); // Reset page on search
    }, 400);

    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Fetch public blogs using React Query
  const blogsQuery = usePublicBlogs({
    page: currentPage,
    limit,
    search: searchKeyword || undefined,
    tag: selectedTag !== 'Tất cả' ? selectedTag : undefined,
  });

  const blogs = blogsQuery.data?.data ?? [];
  const meta = blogsQuery.data?.meta ?? { page: 1, limit: 6, total: 0, totalPages: 1 };

  const handleTagClick = (tag) => {
    setSelectedTag(tag);
    setCurrentPage(1);
  };

  return (
    <div className="bg-gray-50 min-h-screen pb-12">
      {/* Hero section */}
      <section className="bg-gradient-to-r from-cyan-600 to-teal-500 text-white py-16 text-center">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-3xl md:text-4xl font-extrabold mb-3">Cẩm nang sức khỏe</h1>
          <p className="text-cyan-50 text-sm md:text-base max-w-xl mx-auto">
            Kiến thức y tế thường thức hữu ích được tham vấn chuyên môn từ đội ngũ chuyên gia bác sĩ CarePlus.
          </p>
        </div>
      </section>

      {/* Filter and Search Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <div className="bg-white rounded-2xl border border-gray-150 p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Search bar */}
          <div className="relative max-w-sm w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm kiếm bài viết..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 bg-white"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')} 
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            )}
          </div>

          {/* Tags list */}
          <div className="flex flex-wrap gap-2 overflow-x-auto pb-1 max-w-full">
            {TAG_FILTERS.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => handleTagClick(tag)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                  selectedTag === tag
                    ? 'bg-cyan-600 text-white shadow-sm'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Blog Cards Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        {blogsQuery.isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, idx) => (
              <div key={idx} className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm animate-pulse">
                <div className="w-full h-48 bg-gray-200 rounded-xl mb-4" />
                <div className="h-4 bg-gray-200 rounded w-1/4 mb-2" />
                <div className="h-5 bg-gray-200 rounded w-3/4 mb-2" />
                <div className="h-4 bg-gray-200 rounded w-full mb-1" />
                <div className="h-4 bg-gray-200 rounded w-2/3" />
              </div>
            ))}
          </div>
        ) : blogsQuery.isError ? (
          <div className="py-16 text-center bg-white rounded-2xl border border-gray-150 p-8 shadow-sm">
            <span className="text-3xl mb-3 block">⚠️</span>
            <h3 className="font-bold text-gray-900 mb-1">Đã có lỗi xảy ra khi tải bài viết</h3>
            <p className="text-sm text-gray-500 mb-4">{blogsQuery.error?.message || 'Vui lòng thử lại sau.'}</p>
            <button
              onClick={() => blogsQuery.refetch()}
              className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-xs font-semibold transition-colors shadow-sm"
            >
              Thử lại
            </button>
          </div>
        ) : blogs.length === 0 ? (
          <div className="py-16 text-center bg-white rounded-2xl border border-gray-150 p-8 shadow-sm">
            <span className="text-3xl mb-3 block">📖</span>
            <h3 className="font-bold text-gray-900 mb-1">Không tìm thấy bài viết nào</h3>
            <p className="text-sm text-gray-500">Hãy thử tìm kiếm với từ khóa khác hoặc lọc theo chuyên khoa khác.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {blogs.map((blog) => (
                <div key={blog.id}>
                  <BlogCard blog={blog} />
                </div>
              ))}
            </div>

            {/* Pagination Controls */}
            {meta.totalPages > 1 && (
              <div className="flex items-center justify-center gap-4 mt-10">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className={`px-4 py-2 border rounded-xl text-xs font-semibold transition-colors ${
                    currentPage === 1 
                      ? 'border-gray-200 text-gray-300 cursor-not-allowed bg-gray-50' 
                      : 'border-cyan-500 text-cyan-600 hover:bg-cyan-50 bg-white cursor-pointer'
                  }`}
                >
                  &larr; Trước
                </button>
                
                <span className="text-xs text-gray-500 font-medium">
                  Trang <strong className="text-gray-900">{currentPage}</strong> / {meta.totalPages}
                </span>

                <button
                  onClick={() => setCurrentPage((p) => Math.min(meta.totalPages, p + 1))}
                  disabled={currentPage === meta.totalPages}
                  className={`px-4 py-2 border rounded-xl text-xs font-semibold transition-colors ${
                    currentPage === meta.totalPages 
                      ? 'border-gray-200 text-gray-300 cursor-not-allowed bg-gray-50' 
                      : 'border-cyan-500 text-cyan-600 hover:bg-cyan-50 bg-white cursor-pointer'
                  }`}
                >
                  Sau &rarr;
                </button>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}
