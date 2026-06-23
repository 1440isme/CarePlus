import { useState } from 'react';
import { useSubmitReview } from '../hooks/useReview.js';
import './review-modal.css';

export default function ReviewModal({ isOpen, onClose, appointment, onSuccess }) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [touched, setTouched] = useState(false);
  const submitMutation = useSubmitReview();

  if (!isOpen || !appointment) return null;

  const doctorName = appointment.doctor?.name || appointment.doctorName || 'Bác sĩ';
  const specialtyName = appointment.specialty?.name || 'Chuyên khoa';
  const doctorAvatarLetter = doctorName ? doctorName.trim().split(' ').pop().charAt(0) : 'D';

  const commentLength = comment.trim().length;
  const isCommentTooShort = touched && commentLength < 10;
  const isCommentTooLong = commentLength > 1000;
  const isInvalid = rating === 0 || commentLength < 10 || isCommentTooLong;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched(true);

    if (rating === 0) {
      return;
    }
    if (commentLength < 10 || isCommentTooLong) {
      return;
    }

    try {
      await submitMutation.mutateAsync({
        appointmentId: appointment.id,
        rating,
        comment: comment.trim(),
      });
      // Reset state on success
      setRating(0);
      setComment('');
      setTouched(false);
      if (onSuccess) {
        onSuccess(appointment.id);
      }
      onClose();
    } catch (err) {
      console.error('Error submitting review:', err);
    }
  };

  const handleClose = () => {
    setRating(0);
    setComment('');
    setTouched(false);
    onClose();
  };

  return (
    <div className="review-modal-backdrop" onClick={handleClose}>
      <div className="review-modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="review-modal-header">
          <h3 className="review-modal-title">Đánh giá dịch vụ khám</h3>
          <button type="button" className="review-modal-close-btn" onClick={handleClose}>
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="review-modal-body">
            {/* Doctor Info Block */}
            <div className="review-doctor-info">
              <div className="review-doctor-avatar">
                {doctorAvatarLetter}
              </div>
              <div className="review-doctor-details">
                <h4 className="review-doctor-name">{doctorName}</h4>
                <p className="review-doctor-specialty">{specialtyName}</p>
              </div>
            </div>

            {/* Stars selection */}
            <div className="review-form-group">
              <label className="review-label">
                Mức độ hài lòng của bạn <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <div className="review-stars-container">
                {[1, 2, 3, 4, 5].map((star) => {
                  const isActive = (hoverRating || rating) >= star;
                  return (
                    <button
                      key={star}
                      type="button"
                      className="review-star-btn"
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      aria-label={`${star} sao`}
                    >
                      <svg className={`review-star-icon ${isActive ? 'active' : ''}`} viewBox="0 0 24 24">
                        <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                      </svg>
                    </button>
                  );
                })}
              </div>
              {touched && rating === 0 && (
                <div className="review-error-message">
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="12"></line>
                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                  </svg>
                  Vui lòng chọn số sao đánh giá.
                </div>
              )}
            </div>

            {/* Textarea comments */}
            <div className="review-form-group">
              <label className="review-label" htmlFor="review-comment">
                Ý kiến phản hồi <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <div className="review-textarea-wrapper">
                <textarea
                  id="review-comment"
                  className={`review-textarea ${isCommentTooShort ? 'invalid' : ''}`}
                  placeholder="Chia sẻ trải nghiệm khám chữa bệnh của bạn tại CarePlus (tối thiểu 10 ký tự)..."
                  value={comment}
                  onChange={(e) => {
                    setComment(e.target.value);
                    if (e.target.value.trim().length >= 10) {
                      setTouched(true);
                    }
                  }}
                  onBlur={() => setTouched(true)}
                  rows={4}
                />
              </div>

              <div className={`review-char-counter ${isCommentTooShort ? 'error' : isCommentTooLong ? 'error' : 'success'}`}>
                <span>
                  {isCommentTooShort && 'Nội dung quá ngắn (tối thiểu 10 ký tự)'}
                  {isCommentTooLong && 'Nội dung quá dài (tối đa 1000 ký tự)'}
                </span>
                <span>{commentLength} / 1000</span>
              </div>

              {submitMutation.isError && (
                <div className="review-error-message">
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="12"></line>
                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                  </svg>
                  {submitMutation.error?.response?.data?.error?.message || submitMutation.error?.message || 'Có lỗi xảy ra khi gửi đánh giá.'}
                </div>
              )}
            </div>
          </div>

          <div className="review-modal-footer">
            <button
              type="button"
              className="review-btn review-btn-cancel"
              onClick={handleClose}
              disabled={submitMutation.isPending}
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              className="review-btn review-btn-submit"
              disabled={isInvalid || submitMutation.isPending}
            >
              {submitMutation.isPending && <span className="review-spinner" />}
              {submitMutation.isPending ? 'Đang gửi...' : 'Gửi đánh giá'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
