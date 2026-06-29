import { useState } from 'react';
import { useAdminBlogs, useCreateBlog, useUpdateBlog, useDeleteBlog } from '../../features/blog/index.js';
import CKEditorWrapper from '../../shared/components/ui/CKEditorWrapper.jsx';
import axiosInstance from '../../shared/services/axios.instance.js';
import { Plus, Search, Edit, Trash2, BookOpen, Image, X, ChevronLeft, ChevronRight, ArrowLeft } from 'lucide-react';
import './blog-management.css';

export default function BlogManagement() {
  const [viewState, setViewState] = useState({ mode: 'list', blogId: null }); // 'list' | 'create' | 'edit'
  const [searchKeyword, setSearchKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const limit = 10;

  // Form states
  const [formTitle, setFormTitle] = useState('');
  const [formSlug, setFormSlug] = useState('');
  const [formSummary, setFormSummary] = useState('');
  const [formThumbnail, setFormThumbnail] = useState('');
  const [formStatus, setFormStatus] = useState('DRAFT');
  const [formTags, setFormTags] = useState('');
  const [formContent, setFormContent] = useState('');
  
  // Defer upload states
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [thumbnailPreview, setThumbnailPreview] = useState('');
  const [uploading, setUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Fetch admin blogs
  const blogsQuery = useAdminBlogs({
    page: currentPage,
    limit,
    search: searchKeyword || undefined,
    status: statusFilter !== 'ALL' ? statusFilter : undefined
  });

  const blogs = blogsQuery.data?.data ?? [];
  const meta = blogsQuery.data?.meta ?? { page: 1, limit: 10, total: 0, totalPages: 1 };

  // Mutations
  const createMutation = useCreateBlog({
    onSuccess: () => {
      setSuccessMsg('Tạo bài viết thành công!');
      resetForm();
      setViewState({ mode: 'list', blogId: null });
    },
    onError: (err) => {
      setErrorMsg(err.message || 'Lỗi khi tạo bài viết');
    }
  });

  const updateMutation = useUpdateBlog({
    onSuccess: () => {
      setSuccessMsg('Cập nhật bài viết thành công!');
      resetForm();
      setViewState({ mode: 'list', blogId: null });
    },
    onError: (err) => {
      setErrorMsg(err.message || 'Lỗi khi cập nhật bài viết');
    }
  });

  const deleteMutation = useDeleteBlog({
    onSuccess: () => {
      setSuccessMsg('Xóa bài viết thành công!');
    },
    onError: (err) => {
      setErrorMsg(err.message || 'Lỗi khi xóa bài viết');
    }
  });

  const resetForm = () => {
    setFormTitle('');
    setFormSlug('');
    setFormSummary('');
    setFormThumbnail('');
    setFormStatus('DRAFT');
    setFormTags('');
    setFormContent('');
    setThumbnailFile(null);
    setThumbnailPreview('');
    setErrorMsg('');
    setSuccessMsg('');
  };

  const handleEditClick = async (blog) => {
    resetForm();
    setViewState({ mode: 'edit', blogId: blog.id });
    setFormTitle(blog.title || '');
    setFormSlug(blog.slug || '');
    setFormSummary(blog.summary || '');
    setFormThumbnail(blog.thumbnail || '');
    setThumbnailPreview(blog.thumbnail || '');
    setFormStatus(blog.status || 'DRAFT');
    setFormTags(blog.tags ? blog.tags.join(', ') : '');
    setFormContent(blog.content || '');
  };

  const handleDeleteClick = (id) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa bài viết này?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setThumbnailFile(file);
    setThumbnailPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    
    if (!formTitle.trim()) return setErrorMsg('Tiêu đề không được bỏ trống.');
    if (!formContent.trim() || formContent === '<p>&nbsp;</p>') return setErrorMsg('Nội dung chi tiết không được bỏ trống.');

    let finalThumbnail = formThumbnail.trim() || undefined;

    if (thumbnailFile) {
      const formData = new FormData();
      formData.append('image', thumbnailFile);
      formData.append('type', 'blog');

      try {
        setUploading(true);
        setErrorMsg('');
        const res = await axiosInstance.post('/upload/image', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
        if (res.data?.success && res.data?.data?.url) {
          finalThumbnail = res.data.data.url;
        } else {
          throw new Error('Upload to Cloudinary failed');
        }
      } catch (err) {
        console.error('File upload failed:', err);
        setErrorMsg(err.message || 'Không thể upload hình ảnh lên Cloudinary.');
        setUploading(false);
        return;
      } finally {
        setUploading(false);
      }
    }

    const payload = {
      title: formTitle.trim(),
      slug: formSlug.trim() || undefined,
      summary: formSummary.trim() || undefined,
      thumbnail: finalThumbnail,
      status: formStatus,
      tags: formTags.trim() || undefined,
      content: formContent
    };

    if (viewState.mode === 'create') {
      createMutation.mutate(payload);
    } else {
      updateMutation.mutate({ id: viewState.blogId, payload });
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'PUBLISHED': return 'badge-published';
      case 'DRAFT': return 'badge-draft';
      case 'ARCHIVED': return 'badge-archived';
      default: return '';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'PUBLISHED': return 'Đã xuất bản';
      case 'DRAFT': return 'Bản nháp';
      case 'ARCHIVED': return 'Lưu trữ';
      default: return status;
    }
  };

  return (
    <div className="blog-mgmt-container">
      {/* Messages */}
      {successMsg && <div className="toast success-toast">{successMsg}</div>}
      {errorMsg && <div className="toast error-toast">{errorMsg}</div>}

      {viewState.mode === 'list' ? (
        // LIST VIEW
        <div className="blog-mgmt-list-view">
          <div className="blog-mgmt-header">
            <h2>Quản lý bài viết</h2>
            <button 
              className="btn-create-post"
              onClick={() => { resetForm(); setViewState({ mode: 'create', blogId: null }); }}
            >
              ➕ Viết bài mới
            </button>
          </div>

          {/* Filters Bar */}
          <div className="blog-mgmt-filters">
            <input 
              type="text"
              placeholder="Tìm theo tiêu đề bài viết..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              className="search-input"
            />

            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="status-select"
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="PUBLISHED">Đã xuất bản</option>
              <option value="DRAFT">Bản nháp</option>
              <option value="ARCHIVED">Lưu trữ</option>
            </select>
          </div>

          {/* Blog list */}
          {blogsQuery.isLoading ? (
            <div className="blog-mgmt-loading">Đang tải danh sách bài viết...</div>
          ) : blogs.length === 0 ? (
            <div className="blog-mgmt-empty">Chưa có bài viết nào phù hợp.</div>
          ) : (
            <div className="blog-mgmt-cards-list">
              {blogs.map((blog) => (
                <div key={blog.id} className="blog-mgmt-item-card">
                  <div className="item-card-left">
                    {blog.thumbnail ? (
                      <img src={blog.thumbnail} alt={blog.title} className="item-card-thumb" />
                    ) : (
                      <div className="item-card-thumb-placeholder">📖</div>
                    )}
                    <div className="item-card-details">
                      <h3>{blog.title}</h3>
                      <p>
                        <span className="item-card-category">
                          {blog.tags && blog.tags.length > 0 ? blog.tags.join(', ') : 'Chung'}
                        </span>
                        {' · '}
                        <span className="item-card-date">
                          {new Date(blog.createdAt).toLocaleDateString('vi-VN')}
                        </span>
                        {blog.author && (
                          <>
                            {' · '}
                            <span className="item-card-author">bởi {blog.author.name}</span>
                          </>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="item-card-right">
                    <span className={`status-badge ${getStatusBadgeClass(blog.status)}`}>
                      {getStatusText(blog.status)}
                    </span>
                    
                    <div className="item-card-actions">
                      <button 
                        onClick={() => handleEditClick(blog)}
                        className="action-btn edit-btn"
                        title="Chỉnh sửa"
                      >
                        ✏️
                      </button>
                      <button 
                        onClick={() => handleDeleteClick(blog.id)}
                        className="action-btn delete-btn"
                        title="Xóa"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {/* Pagination */}
              {meta.totalPages > 1 && (
                <div className="blog-mgmt-pagination">
                  <button 
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    Trước
                  </button>
                  <span>Trang {currentPage} / {meta.totalPages}</span>
                  <button 
                    onClick={() => setCurrentPage(p => Math.min(meta.totalPages, p + 1))}
                    disabled={currentPage === meta.totalPages}
                  >
                    Sau
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        // CREATE / EDIT FORM VIEW
        <div className="blog-mgmt-form-view">
          <div className="blog-mgmt-header">
            <h2>{viewState.mode === 'create' ? 'Tạo bài viết mới' : 'Chỉnh sửa bài viết'}</h2>
            <button className="btn-cancel" onClick={() => setViewState({ mode: 'list', blogId: null })}>
              Quay lại danh sách
            </button>
          </div>

          <form onSubmit={handleSubmit} className="blog-form">
            <div className="form-group">
              <label htmlFor="post-title">Tiêu đề bài viết <span className="required">*</span></label>
              <input
                id="post-title"
                type="text"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder="Nhập tiêu đề hấp dẫn..."
                required
              />
            </div>

            <div className="form-row-2">
              <div className="form-group">
                <label htmlFor="post-slug">Đường dẫn tĩnh (Slug)</label>
                <input
                  id="post-slug"
                  type="text"
                  value={formSlug}
                  onChange={(e) => setFormSlug(e.target.value)}
                  placeholder="slug-tieu-de-viet-tat (để trống tự động tạo)"
                />
              </div>

              <div className="form-group">
                <label htmlFor="post-status">Trạng thái bài viết</label>
                <select id="post-status" value={formStatus} onChange={(e) => setFormStatus(e.target.value)}>
                  <option value="DRAFT">Bản nháp (Draft)</option>
                  <option value="PUBLISHED">Xuất bản công khai (Published)</option>
                  <option value="ARCHIVED">Lưu trữ (Archived)</option>
                </select>
              </div>
            </div>

            <div className="form-row-2">
              <div className="form-group">
                <label htmlFor="post-tags">Từ khóa (Tags) - Phân cách bằng dấu phẩy</label>
                <input
                  id="post-tags"
                  type="text"
                  value={formTags}
                  onChange={(e) => setFormTags(e.target.value)}
                  placeholder="Ví dụ: Tim mạch, Dinh dưỡng, Cơ Xương Khớp"
                />
              </div>

              <div className="form-group">
                <label>Ảnh đại diện (Thumbnail)</label>
                <div className="thumbnail-upload-container">
                  <input
                    type="text"
                    value={formThumbnail}
                    onChange={(e) => {
                      setFormThumbnail(e.target.value);
                      setThumbnailPreview(e.target.value);
                      setThumbnailFile(null); // Clear file if they manually type URL
                    }}
                    placeholder="URL ảnh đại diện hoặc tải lên file..."
                    className="thumbnail-url-input"
                  />
                  <label className="file-upload-btn">
                    Tải ảnh
                    <input type="file" accept="image/*" onChange={handleFileUpload} style={{ display: 'none' }} />
                  </label>
                </div>
                {uploading && <div className="upload-status">Đang tải ảnh lên Cloudinary...</div>}
                {thumbnailPreview && (
                  <div className="thumbnail-preview-box">
                    <img src={thumbnailPreview} alt="Thumbnail preview" />
                    <button
                      type="button"
                      onClick={() => {
                        setFormThumbnail('');
                        setThumbnailFile(null);
                        setThumbnailPreview('');
                      }}
                      className="remove-preview-btn"
                    >
                      Xóa
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="post-summary">Tóm tắt ngắn bài viết</label>
              <textarea
                id="post-summary"
                rows="2"
                value={formSummary}
                onChange={(e) => setFormSummary(e.target.value)}
                placeholder="Nhập mô tả ngắn gọn hiển thị trên trang danh sách (tối đa 500 ký tự)..."
              />
            </div>

            <div className="form-group">
              <label>Nội dung chi tiết bài viết <span className="required">*</span></label>
              <CKEditorWrapper 
                value={formContent}
                onChange={(data) => setFormContent(data)}
              />
            </div>

            <div className="form-actions-bar">
              <button 
                type="button" 
                className="btn-form-cancel" 
                onClick={() => setViewState({ mode: 'list', blogId: null })}
              >
                Hủy bỏ
              </button>
              <button 
                type="submit" 
                className="btn-form-save"
                disabled={createMutation.isPending || updateMutation.isPending || uploading}
              >
                {createMutation.isPending || updateMutation.isPending ? 'Đang lưu...' : 'Lưu bài viết'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
