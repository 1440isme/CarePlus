import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './homepage.css';

// API Base URL
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

export default function HomePage() {
  const navigate = useNavigate();
  const [specialtyQuery, setSpecialtyQuery] = useState('');
  
  // Data States
  const [specialties, setSpecialties] = useState([]);
  const [expDoctors, setExpDoctors] = useState([]);
  const [favDoctors, setFavDoctors] = useState([]);
  const [blogs, setBlogs] = useState([]);

  // Fetching States
  const [loadingSpecialties, setLoadingSpecialties] = useState(true);
  const [loadingExpDoctors, setLoadingExpDoctors] = useState(true);
  const [loadingFavDoctors, setLoadingFavDoctors] = useState(true);
  const [loadingBlogs, setLoadingBlogs] = useState(true);

  // Connection Error States
  const [isApiOffline, setIsApiOffline] = useState(false);

  // Fallback Mock Data in case API is offline
  const mockSpecialties = [
    { id: 's1', name: 'Cơ Xương Khớp', slug: 'co-xuong-khop', description: 'Chẩn đoán và điều trị bệnh khớp, xương, cơ, cột sống.', icon: '🦴', doctorCount: 3 },
    { id: 's2', name: 'Tim mạch', slug: 'tim-mach', description: 'Khám và điều trị các bệnh lý tim mạch, cao huyết áp.', icon: '❤️', doctorCount: 2 },
    { id: 's3', name: 'Tai Mũi Họng', slug: 'tai-mui-hong', description: 'Điều trị viêm xoang, viêm tai giữa, viêm họng, amidan.', icon: '👂', doctorCount: 2 },
    { id: 's4', name: 'Nhi khoa', slug: 'nhi-khoa', description: 'Chăm sóc sức khỏe toàn diện cho trẻ sơ sinh đến 15 tuổi.', icon: '👶', doctorCount: 3 },
    { id: 's5', name: 'Da liễu', slug: 'da-lieu', description: 'Điều trị các bệnh về da, mụn, dị ứng, viêm da cơ địa.', icon: '🩺', doctorCount: 2 },
    { id: 's6', name: 'Sản phụ khoa', slug: 'san-phu-khoa', description: 'Chăm sóc sức khỏe thai kỳ và các bệnh phụ khoa nữ.', icon: '🤱', doctorCount: 2 },
    { id: 's7', name: 'Răng Hàm Mặt', slug: 'rang-ham-mat', description: 'Khám răng, niềng răng, nhổ răng khôn và thẩm mỹ nha khoa.', icon: '🦷', doctorCount: 2 },
    { id: 's8', name: 'Mắt', slug: 'mat', description: 'Đo tật khúc xạ, khám và điều trị đục thủy tinh thể, cận thị.', icon: '👁️', doctorCount: 2 },
  ];

  const mockExpDoctors = [
    { id: 'd1', title: 'TS.BS', name: 'Phạm Hoàng Nam', experience: 15, rating: 4.9, reviewCount: 120, price: 350000, specialtyName: 'Cơ Xương Khớp' },
    { id: 'd2', title: 'BS.CKII', name: 'Trần Quốc Huy', experience: 14, rating: 4.8, reviewCount: 98, price: 300000, specialtyName: 'Tim mạch' },
    { id: 'd3', title: 'ThS.BS', name: 'Vũ Đức Thành', experience: 12, rating: 4.7, reviewCount: 75, price: 280000, specialtyName: 'Tai Mũi Họng' },
    { id: 'd4', title: 'BS.CKI', name: 'Nguyễn Thu Hương', experience: 9, rating: 4.6, reviewCount: 64, price: 280000, specialtyName: 'Da liễu' },
  ];

  const mockFavDoctors = [
    { id: 'd1', title: 'TS.BS', name: 'Phạm Hoàng Nam', experience: 15, rating: 4.9, reviewCount: 120, price: 350000, specialtyName: 'Cơ Xương Khớp' },
    { id: 'd5', title: 'ThS.BS', name: 'Nguyễn Minh Anh', experience: 8, rating: 4.8, reviewCount: 88, price: 300000, specialtyName: 'Tim mạch' },
    { id: 'd2', title: 'BS.CKII', name: 'Trần Quốc Huy', experience: 14, rating: 4.8, reviewCount: 98, price: 300000, specialtyName: 'Tim mạch' },
    { id: 'd6', title: 'BS', name: 'Lê Thảo Vy', experience: 7, rating: 4.7, reviewCount: 54, price: 250000, specialtyName: 'Nhi khoa' },
  ];

  const mockBlogs = [
    { id: 'b1', title: 'Phòng ngừa bệnh tim mạch hiệu quả tại nhà', slug: 'phong-ngua-tim-mach', tag: 'Tim mạch', createdAt: '2026-05-21', icon: '❤️' },
    { id: 'b2', title: 'Chế độ ăn uống tốt cho người bệnh tiêu hóa', slug: 'che-do-an-tieu-hoa', tag: 'Tiêu hóa', createdAt: '2026-05-16', icon: '🍏' },
    { id: 'b3', title: 'Cách chăm sóc da đúng cách trong mùa hè', slug: 'cham-soc-da-mua-he', tag: 'Da liễu', createdAt: '2026-05-11', icon: '☀️' },
    { id: 'b4', title: 'Dinh dưỡng cho trẻ em trong giai đoạn phát triển', slug: 'dinh-duong-cho-tre', tag: 'Nhi khoa', createdAt: '2026-05-08', icon: '👶' },
  ];

  useEffect(() => {
    // 1. Fetch Specialties
    axios.get(`${API_BASE_URL}/specialties`)
      .then(res => {
        if (res.data && res.data.success) {
          setSpecialties(res.data.data);
        } else {
          // Empty state fallback if success is false or no data
          setSpecialties([]);
        }
      })
      .catch(() => {
        setIsApiOffline(true);
        setSpecialties(mockSpecialties); // Fallback to mock to let UI render normally
      })
      .finally(() => setLoadingSpecialties(false));

    // 2. Fetch Experienced Doctors
    axios.get(`${API_BASE_URL}/doctors?sortBy=experience&sortOrder=desc&limit=4`)
      .then(res => {
        if (res.data && res.data.success) {
          setExpDoctors(res.data.data);
        }
      })
      .catch(() => {
        setIsApiOffline(true);
        setExpDoctors(mockExpDoctors);
      })
      .finally(() => setLoadingExpDoctors(false));

    // 3. Fetch Favorite Doctors
    axios.get(`${API_BASE_URL}/doctors?sortBy=rating&sortOrder=desc&limit=4`)
      .then(res => {
        if (res.data && res.data.success) {
          setFavDoctors(res.data.data);
        }
      })
      .catch(() => {
        setIsApiOffline(true);
        setFavDoctors(mockFavDoctors);
      })
      .finally(() => setLoadingFavDoctors(false));

    // 4. Fetch Blogs
    axios.get(`${API_BASE_URL}/blogs?limit=4`)
      .then(res => {
        if (res.data && res.data.success) {
          setBlogs(res.data.data);
        }
      })
      .catch(() => {
        setIsApiOffline(true);
        setBlogs(mockBlogs);
      })
      .finally(() => setLoadingBlogs(false));
  }, []);

  const handleHeroSearch = (e) => {
    e.preventDefault();
    if (specialtyQuery.trim()) {
      navigate(`/chuyen-khoa?search=${encodeURIComponent(specialtyQuery.trim())}`);
    }
  };

  const getInitials = (name) => {
    if (!name) return 'BS';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[parts.length - 2][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const formatPrice = (value) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
  };

  return (
    <div className="homepage-container">
      {/* API Connection Indicator for Developers */}
      {isApiOffline && (
        <div className="api-fallback-status">
          <span className="api-fallback-badge">OFFLINE PREVIEW</span>
          <span>Không thể kết nối với Backend Server. Đang hiển thị dữ liệu mẫu từ Figma làm sườn chính để kiểm tra UI.</span>
        </div>
      )}

      {/* 1. HERO BANNER */}
      <section className="hero-section">
        <div className="container-center hero-container">
          <div className="hero-content">
            <span className="hero-badge">Y Khoa Chuyên Nghiệp</span>
            <h1>Chăm sóc sức khỏe<br />Chủ động & Đáng tin cậy</h1>
            <p>
              Đặt lịch khám trực tuyến nhanh chóng với đội ngũ bác sĩ chuyên khoa đầu ngành. Giải pháp y tế thông minh, minh bạch và chu đáo dành cho cả gia đình bạn.
            </p>
            
            <form onSubmit={handleHeroSearch} className="hero-search-box">
              <input
                type="text"
                placeholder="Tìm kiếm chuyên khoa bạn đang quan tâm..."
                value={specialtyQuery}
                onChange={(e) => setSpecialtyQuery(e.target.value)}
                className="hero-search-input"
              />
              <button type="submit" className="hero-search-btn">Tìm kiếm</button>
            </form>

            <div className="hero-actions">
              <Link to="/dat-lich" className="btn btn-primary btn-large">Đặt lịch khám ngay</Link>
              <Link to="/ve-chung-toi" className="btn btn-outline">Tìm hiểu thêm</Link>
            </div>
          </div>

          <div className="hero-visual">
            <div className="hero-circle-bg"></div>
            <div className="hero-placeholder-card">
              <div className="hero-placeholder-icon">🏥</div>
              <h3>CarePlus Clinic</h3>
              <p>Hệ thống đặt lịch khám trực tuyến hoạt động 24/7</p>
            </div>
          </div>
        </div>
      </section>

      {/* 2. QUICK SERVICES */}
      <section className="services-section section-padding">
        <div className="container-center">
          <div className="services-grid">
            <Link to="/chuyen-khoa" className="service-card">
              <div className="service-icon-wrapper bg-cyan-light">🗂️</div>
              <h3>Khám chuyên khoa</h3>
              <p>8 chuyên khoa đa dạng phục vụ mọi nhu cầu sức khỏe của gia đình bạn.</p>
            </Link>
            
            <Link to="/bac-si" className="service-card">
              <div className="service-icon-wrapper bg-yellow-light">👨‍⚕️</div>
              <h3>Bác sĩ nổi bật</h3>
              <p>Đội ngũ chuyên gia giàu kinh nghiệm, chu đáo và tận tâm.</p>
            </Link>

            <Link to="/dat-lich" className="service-card">
              <div className="service-icon-wrapper bg-green-light">📅</div>
              <h3>Đặt lịch trong ngày</h3>
              <p>Tìm khung giờ trống và đăng ký khám ngay trong ngày hôm nay.</p>
            </Link>

            <Link to="/faq" className="service-card">
              <div className="service-icon-wrapper bg-purple-light">❓</div>
              <h3>Hỏi đáp & Hướng dẫn</h3>
              <p>Giải đáp thắc mắc nhanh chóng về thủ tục và hồ sơ y tế.</p>
            </Link>
          </div>
        </div>
      </section>

      {/* 3. SPECIALTIES */}
      <section className="specialties-section section-padding">
        <div className="container-center">
          <div className="section-header">
            <div className="section-header-left">
              <h2>Chuyên khoa phổ biến</h2>
              <p>Đội ngũ chuyên gia hàng đầu trong nhiều lĩnh vực y tế</p>
            </div>
            <Link to="/chuyen-khoa" className="view-all-link">
              Xem tất cả <span>&rarr;</span>
            </Link>
          </div>

          <div className="specialties-grid">
            {loadingSpecialties ? (
              // Specialties Skeletons
              Array.from({ length: 8 }).map((_, idx) => (
                <div key={idx} className="skeleton-card">
                  <div className="skeleton-circle skeleton-shimmer"></div>
                  <div className="skeleton-title skeleton-shimmer"></div>
                  <div className="skeleton-text-line skeleton-shimmer"></div>
                  <div className="skeleton-text-line skeleton-shimmer short"></div>
                </div>
              ))
            ) : specialties.length === 0 ? (
              <div className="error-fallback-container">
                <h4>Không tìm thấy dữ liệu chuyên khoa</h4>
                <p>Vui lòng kiểm tra lại kết nối hoặc thiết lập trong quản trị viên.</p>
              </div>
            ) : (
              specialties.map((spec) => (
                <Link to={`/chuyen-khoa/${spec.slug}`} key={spec.id} className="specialty-card">
                  <div className="specialty-header">
                    <span className="specialty-icon">{spec.icon || '🩺'}</span>
                    <h3>{spec.name}</h3>
                  </div>
                  <p className="specialty-desc">{spec.description}</p>
                  <div className="specialty-footer">
                    <span className="specialty-count">{spec.doctorCount || 0} bác sĩ</span>
                    <span className="arrow-icon">&rarr;</span>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </section>

      {/* 4. EXPERIENCED DOCTORS */}
      <section className="doctors-section section-padding">
        <div className="container-center">
          <div className="section-header">
            <div className="section-header-left">
              <h2>Đội ngũ bác sĩ kinh nghiệm</h2>
              <p>Những chuyên gia y tế có nhiều năm công tác tại các bệnh viện lớn</p>
            </div>
            <Link to="/bac-si" className="view-all-link">
              Xem tất cả <span>&rarr;</span>
            </Link>
          </div>

          <div className="doctors-grid">
            {loadingExpDoctors ? (
              // Doctors Skeletons
              Array.from({ length: 4 }).map((_, idx) => (
                <div key={idx} className="skeleton-doctor-card">
                  <div className="skeleton-img skeleton-shimmer"></div>
                  <div style={{ padding: '20px' }}>
                    <div className="skeleton-title skeleton-shimmer" style={{ width: '40%' }}></div>
                    <div className="skeleton-title skeleton-shimmer" style={{ marginTop: '10px' }}></div>
                    <div className="skeleton-text-line skeleton-shimmer"></div>
                    <div className="skeleton-text-line skeleton-shimmer short"></div>
                  </div>
                </div>
              ))
            ) : expDoctors.length === 0 ? (
              <div className="error-fallback-container">
                <h4>Chưa có hồ sơ bác sĩ nào hoạt động</h4>
                <p>Danh sách bác sĩ đang được cập nhật, quý khách vui lòng quay lại sau.</p>
              </div>
            ) : (
              expDoctors.map((doc) => (
                <div key={doc.id} className="doctor-card">
                  <div className="doctor-photo-placeholder">
                    {/* Placeholder Circle Initials */}
                    <div className="doctor-initials">
                      {getInitials(doc.name)}
                    </div>
                    <span className="doctor-rating-badge">
                      ⭐ {doc.rating ? doc.rating.toFixed(1) : '5.0'} ({doc.reviewCount || 0})
                    </span>
                  </div>
                  <div className="doctor-info">
                    <span className="doctor-specialty-tag">{doc.specialtyName}</span>
                    <h3>{doc.title} {doc.name}</h3>
                    <ul className="doctor-stats">
                      <li>
                        <span className="doctor-stats-icon">💼</span>
                        <span>{doc.experience} năm kinh nghiệm</span>
                      </li>
                      <li>
                        <span className="doctor-stats-icon">🛡️</span>
                        <span>Bác sĩ chuyên khoa chính thức</span>
                      </li>
                    </ul>
                    <div className="doctor-price-row">
                      <span className="price-label">Giá khám tham khảo:</span>
                      <span className="price-value">{formatPrice(doc.price)}</span>
                    </div>
                    <Link to={`/bac-si/${doc.id}`} className="btn btn-outline doctor-action-btn">Xem lịch khám</Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* 5. FAVORITE DOCTORS */}
      <section className="doctors-section section-padding" style={{ paddingTop: 0 }}>
        <div className="container-center">
          <div className="section-header">
            <div className="section-header-left">
              <h2>Bác sĩ được yêu thích nhất</h2>
              <p>Được đánh giá cao bởi sự tận tâm, chuyên môn và trải nghiệm dịch vụ chu đáo</p>
            </div>
            <Link to="/bac-si" className="view-all-link">
              Xem tất cả <span>&rarr;</span>
            </Link>
          </div>

          <div className="doctors-grid">
            {loadingFavDoctors ? (
              // Doctors Skeletons
              Array.from({ length: 4 }).map((_, idx) => (
                <div key={idx} className="skeleton-doctor-card">
                  <div className="skeleton-img skeleton-shimmer"></div>
                  <div style={{ padding: '20px' }}>
                    <div className="skeleton-title skeleton-shimmer" style={{ width: '40%' }}></div>
                    <div className="skeleton-title skeleton-shimmer" style={{ marginTop: '10px' }}></div>
                    <div className="skeleton-text-line skeleton-shimmer"></div>
                    <div className="skeleton-text-line skeleton-shimmer short"></div>
                  </div>
                </div>
              ))
            ) : favDoctors.length === 0 ? (
              <div className="error-fallback-container">
                <h4>Chưa có hồ sơ bác sĩ nổi bật</h4>
                <p>Danh sách đang được tổng hợp dựa trên phản hồi khám bệnh thực tế.</p>
              </div>
            ) : (
              favDoctors.map((doc) => (
                <div key={doc.id} className="doctor-card">
                  <div className="doctor-photo-placeholder">
                    {/* Placeholder Circle Initials */}
                    <div className="doctor-initials" style={{ background: '#FFC10E', boxShadow: '0 4px 10px rgba(255, 193, 14, 0.3)' }}>
                      {getInitials(doc.name)}
                    </div>
                    <span className="doctor-rating-badge">
                      ⭐ {doc.rating ? doc.rating.toFixed(1) : '5.0'} ({doc.reviewCount || 0})
                    </span>
                  </div>
                  <div className="doctor-info">
                    <span className="doctor-specialty-tag">{doc.specialtyName}</span>
                    <h3>{doc.title} {doc.name}</h3>
                    <ul className="doctor-stats">
                      <li>
                        <span className="doctor-stats-icon">💼</span>
                        <span>{doc.experience} năm kinh nghiệm</span>
                      </li>
                      <li>
                        <span className="doctor-stats-icon">🛡️</span>
                        <span>Đánh giá xuất sắc từ người khám</span>
                      </li>
                    </ul>
                    <div className="doctor-price-row">
                      <span className="price-label">Giá khám tham khảo:</span>
                      <span className="price-value">{formatPrice(doc.price)}</span>
                    </div>
                    <Link to={`/bac-si/${doc.id}`} className="btn btn-outline doctor-action-btn">Xem lịch khám</Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* 6. BOOKING PROCESS */}
      <section className="process-section section-padding">
        <div className="container-center">
          <div className="section-header" style={{ justifyContent: 'center', textAlign: 'center', marginBottom: '60px' }}>
            <div className="section-header-left" style={{ margin: '0 auto' }}>
              <h2 style={{ textAlign: 'center' }}>Quy trình đặt lịch khám trực tuyến</h2>
              <p>Quy trình 3 bước nhanh chóng giúp bạn tiết kiệm thời gian chờ đợi tại phòng khám</p>
            </div>
          </div>

          <div className="process-grid">
            <div className="process-step">
              <div className="process-number">1</div>
              <h3>Chọn chuyên khoa & Bác sĩ</h3>
              <p>Lựa chọn chuyên khoa phù hợp và bác sĩ bạn mong muốn, sau đó chọn ngày khám và khung giờ trống phù hợp.</p>
            </div>

            <div className="process-step">
              <div className="process-number">2</div>
              <h3>Nhập thông tin người khám</h3>
              <p>Điền thông tin cá nhân của bạn hoặc hồ sơ người thân (tối đa 4 người), kèm theo lý do khám chi tiết.</p>
            </div>

            <div className="process-step">
              <div className="process-number">3</div>
              <h3>Xác nhận lịch & Khám bệnh</h3>
              <p>Kiểm tra lại toàn bộ thông tin và nhận mã đặt lịch khám qua email. Bạn chỉ việc đến phòng khám đúng giờ để check-in.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 7. BENEFITS */}
      <section className="benefits-section section-padding">
        <div className="container-center benefits-container">
          <div className="benefits-content">
            <h2>Lợi ích khi đăng ký đặt lịch trước</h2>
            <p className="subtitle">Chúng tôi tối ưu hóa quy trình y tế để mang lại sự tiện lợi nhất cho gia đình bạn.</p>
            
            <div className="benefits-list">
              <div className="benefit-item">
                <div className="benefit-icon-wrapper">✓</div>
                <div className="benefit-text">
                  <h3>Tiết kiệm thời gian chờ đợi</h3>
                  <p>Check-in nhanh tại quầy lễ tân riêng, giảm thiểu thời gian chờ xếp hàng bốc số.</p>
                </div>
              </div>

              <div className="benefit-item">
                <div className="benefit-icon-wrapper">✓</div>
                <div className="benefit-text">
                  <h3>Chủ động chọn bác sĩ yêu thích</h3>
                  <p>Xem trước thông tin chuyên môn, lịch sử đánh giá của từng bác sĩ để đưa ra quyết định phù hợp nhất.</p>
                </div>
              </div>

              <div className="benefit-item">
                <div className="benefit-icon-wrapper">✓</div>
                <div className="benefit-text">
                  <h3>Quản lý lịch sử và hồ sơ y tế</h3>
                  <p>Lưu trữ và tra cứu lịch sử các lần khám bệnh trước của bạn và người thân dễ dàng.</p>
                </div>
              </div>

              <div className="benefit-item">
                <div className="benefit-icon-wrapper">✓</div>
                <div className="benefit-text">
                  <h3>Tư vấn trực tuyến miễn phí</h3>
                  <p>Trò chuyện trực tuyến với bác sĩ chuyên khoa hoặc nhận hỗ trợ từ lễ tân trước ngày khám.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="benefits-visual">
            <div className="benefits-illustration-placeholder">
              <span className="illustration-icon">📈</span>
              <h4>Chăm sóc y tế chủ động</h4>
              <p>Quản lý lịch trình y học thông minh giúp nâng cao hiệu quả phòng ngừa bệnh tật.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 8. HANDBOOK (BLOGS) */}
      <section className="handbook-section section-padding">
        <div className="container-center">
          <div className="section-header">
            <div className="section-header-left">
              <h2>Cẩm nang sức khỏe</h2>
              <p>Kiến thức y tế hữu ích được tham vấn chuyên môn từ đội ngũ chuyên gia CarePlus</p>
            </div>
            <Link to="/cam-nang" className="view-all-link">
              Xem tất cả <span>&rarr;</span>
            </Link>
          </div>

          <div className="handbook-grid">
            {loadingBlogs ? (
              // Blogs Skeletons
              Array.from({ length: 4 }).map((_, idx) => (
                <div key={idx} className="skeleton-card">
                  <div className="skeleton-img skeleton-shimmer" style={{ height: '140px' }}></div>
                  <div className="skeleton-title skeleton-shimmer"></div>
                  <div className="skeleton-text-line skeleton-shimmer"></div>
                </div>
              ))
            ) : blogs.length === 0 ? (
              <div className="error-fallback-container">
                <h4>Chưa có bài viết cẩm nang nào</h4>
                <p>Các kiến thức thường thức y tế sẽ được cập nhật sớm nhất.</p>
              </div>
            ) : (
              blogs.map((blog) => (
                <Link to={`/cam-nang/${blog.slug}`} key={blog.id} className="handbook-card">
                  <div className="handbook-image-placeholder">
                    {/* Placeholder Icon */}
                    <span>{blog.icon || '📖'}</span>
                  </div>
                  <div className="handbook-info">
                    <span className="handbook-tag">{blog.tag}</span>
                    <h3>{blog.title}</h3>
                    <div className="handbook-meta">
                      <span>📅</span>
                      <span>{blog.createdAt}</span>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
