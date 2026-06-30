import { Link } from 'react-router-dom';

export default function BlogCard({ blog }) {
  const { title, slug, summary, thumbnail, tags, createdAt } = blog;
  const category = tags && tags.length > 0 ? tags[0] : 'Cẩm nang';
  const formattedDate = createdAt ? new Date(createdAt).toLocaleDateString('vi-VN') : '';

  return (
    <Link
      to={`/cam-nang/${slug}`}
      className="bg-white rounded-2xl overflow-hidden border border-gray-100 hover:shadow-md transition-all hover:-translate-y-0.5 group flex flex-col h-full"
    >
      <div className="overflow-hidden h-48 bg-cyan-50 flex items-center justify-center text-4xl">
        {thumbnail ? (
          <img
            src={thumbnail}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <span>📖</span>
        )}
      </div>
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          <span className="text-xs text-cyan-600 font-semibold bg-cyan-50 px-2.5 py-1 rounded-full">
            {category}
          </span>
          <h3 className="text-base font-bold text-gray-900 mt-3 mb-2 line-clamp-2 group-hover:text-cyan-600 transition-colors">
            {title}
          </h3>
          <p className="text-xs text-gray-505 text-gray-500 line-clamp-2 mb-4 leading-relaxed">
            {summary || 'Đọc bài viết để tìm hiểu thêm thông tin...'}
          </p>
        </div>
        <div className="text-[11px] text-gray-400">
          📅 {formattedDate}
        </div>
      </div>
    </Link>
  );
}
