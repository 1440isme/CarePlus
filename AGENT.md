# AGENT.md — CarePlus Development Law

> **Dự án:** CarePlus — Clinic Appointment System
> **Version:** 1.0
> **Cập nhật:** 2026-06-14
> **Hiệu lực:** Bắt buộc cho mọi AI Agent và Developer tham gia dự án

---

## Mục lục

1. [Engineering Principles](#1-engineering-principles)
2. [Architecture Rules](#2-architecture-rules)
3. [Folder Structure Rules](#3-folder-structure-rules)
4. [Single Responsibility Rules](#4-single-responsibility-rules)
5. [Design Pattern Rules](#5-design-pattern-rules)
6. [React Rules](#6-react-rules)
7. [Redux + React Query Rules](#7-redux--react-query-rules)
8. [API Rules](#8-api-rules)
9. [Prisma Rules](#9-prisma-rules)
10. [Database Rules](#10-database-rules)
11. [Redis Rules](#11-redis-rules)
12. [Socket Rules](#12-socket-rules)
13. [Elasticsearch Rules](#13-elasticsearch-rules)
14. [Cloudinary Rules](#14-cloudinary-rules)
15. [Security Rules](#15-security-rules)
16. [Testing Rules](#16-testing-rules)
17. [Performance Rules](#17-performance-rules)
18. [Git Workflow](#18-git-workflow)
19. [Documentation Rules](#19-documentation-rules)
20. [Agent Self Review](#20-agent-self-review)
21. [Anti Patterns](#21-anti-patterns)

---

## 1. Engineering Principles

### SOLID

**S — Single Responsibility**
- Mỗi file, class, function chỉ có MỘT lý do để thay đổi.
- `AppointmentController` chỉ xử lý request/response. Nếu nó tính toán slot availability → vi phạm.

**O — Open/Closed**
- Mở rộng bằng composition, không sửa code cũ.
- ✅ Thêm `EmailNotificationStrategy` mới implement `NotificationStrategy` interface.
- ❌ Sửa hàm `sendNotification()` thêm if/else cho loại notification mới.

**L — Liskov Substitution**
- Mọi subtype phải thay thế được base type mà không phá logic.
- ✅ `DoctorConsultationChat` và `SupportChat` đều implement `ChatConversation` interface.
- ❌ `SupportChat` throw error khi gọi method `getDoctorId()` mà base type định nghĩa.

**I — Interface Segregation**
- Không ép module phụ thuộc interface mà nó không dùng.
- ✅ Tách `Searchable`, `Pageable`, `Sortable` riêng biệt.
- ❌ Một interface `CRUDOperations` chứa tất cả read/write/delete/search/export.

**D — Dependency Inversion**
- Module cấp cao không phụ thuộc module cấp thấp. Cả hai phụ thuộc abstraction.
- ✅ `AppointmentService` nhận `AppointmentRepository` qua constructor injection.
- ❌ `AppointmentService` import trực tiếp `prisma.appointment.findMany()`.

### Separation of Concerns

- Frontend: UI tách khỏi logic tách khỏi data fetching.
- Backend: Route tách Controller tách Service tách Repository.
- ✅ `useAppointmentList` hook chứa logic filter/sort → component chỉ render.
- ❌ Component chứa cả `axios.get()`, state transform, và conditional render 300 dòng.

### Composition over Inheritance

- Không dùng class inheritance cho component hoặc service.
- ✅ `withAuth(Component)` HOC hoặc custom hook `useAuth()`.
- ❌ `class PatientPage extends BasePage`.

### Explicit over Implicit

- Tên biến, function, file phải nói rõ ý nghĩa. Không dùng abbreviation mơ hồ.
- ✅ `getAvailableTimeSlots()`, `appointmentStatus`, `BOOKING_CHANNEL.ONLINE`.
- ❌ `getData()`, `status`, `type`, `flag`, `temp`.

### Convention over Configuration

- Tuân theo convention đặt tên, cấu trúc thư mục, response format đã quy định. Không tự sáng tạo convention mới.
- ✅ Tất cả repository method bắt đầu bằng `find`, `create`, `update`, `delete`.
- ❌ Repository A dùng `get`, Repository B dùng `fetch`, Repository C dùng `load`.

### YAGNI — You Ain't Gonna Need It

- Không viết code cho tính năng chưa có trong spec.
- ✅ Hệ thống không có thanh toán online → không viết PaymentService.
- ❌ Viết sẵn `PaymentGateway`, `InvoiceGenerator` "phòng khi cần".

### KISS — Keep It Simple, Stupid

- Giải pháp đơn giản nhất mà đúng yêu cầu.
- ✅ Enum string cho appointment status thay vì state machine phức tạp ở giai đoạn đầu.
- ❌ Implement full event sourcing cho feature đặt lịch khi chỉ cần CRUD + status transition.

### DRY — Don't Repeat Yourself

- Mỗi logic chỉ tồn tại ở MỘT nơi.
- ✅ Validation schema `appointmentSchema` dùng chung cho cả create và update.
- ❌ Copy paste validation logic vào 3 controller khác nhau.

### Khi KHÔNG áp dụng

| Principle | Khi nào bỏ qua | Lý do |
|-----------|----------------|-------|
| DRY | 2 module có logic giống 80% nhưng domain context khác nhau (Patient booking vs Receptionist booking) | Coupling giữa 2 domain nguy hiểm hơn duplication |
| YAGNI | Đã có trong spec nhưng chưa implement | Spec đã xác nhận → được phép chuẩn bị interface/type |
| KISS | Performance bottleneck đo được | Chỉ optimize khi có benchmark chứng minh |
| Open/Closed | Prototype hoặc spike | Spike cho phép sửa trực tiếp, refactor sau khi validate |

---

## 2. Architecture Rules

### Frontend Architecture

```
UI Component → Feature Module → Custom Hook → Service → Axios Instance → Backend API
```

| Layer | Trách nhiệm | Được làm | KHÔNG được làm |
|-------|-------------|----------|----------------|
| **UI Component** | Render JSX, nhận props, emit events | Gọi hook, render conditional, handle UI event | Gọi API, transform data, chứa business logic |
| **Feature Module** | Tổ hợp components + hooks thành page/feature | Compose components, wire hooks vào UI | Import trực tiếp axios, chứa SQL-like logic |
| **Custom Hook** | Presentation logic, state management | Gọi service, transform response, manage local state | Render JSX, gọi axios trực tiếp |
| **Service** | API call abstraction | Gọi axios instance, transform request/response DTO | Quản lý React state, gọi hook |
| **Axios Instance** | HTTP configuration | Set base URL, interceptor, header | Chứa business logic, transform domain data |

### Backend Architecture

```
Route → Controller → Service → Repository → Prisma Client → MySQL
```

| Layer | Trách nhiệm | Được làm | KHÔNG được làm |
|-------|-------------|----------|----------------|
| **Route** | Định nghĩa endpoint + middleware | Khai báo path, method, attach middleware, gọi controller | Chứa logic, validate, query DB |
| **Controller** | Request/Response handling | Parse params/body, gọi service, format response | Chứa business logic, gọi repository trực tiếp, gọi Prisma |
| **Service** | Business logic | Orchestrate repositories, validate business rules, emit events | Import Prisma client, format HTTP response, access req/res |
| **Repository** | Data access | Query qua Prisma, build filter/include/select | Chứa business logic, format response, access req/res |
| **Prisma Client** | ORM layer | Schema definition, migration, type generation | Chứa logic (đó là repository layer) |

### Infrastructure Layer

| Component | Vai trò | Được gọi từ | KHÔNG được gọi từ |
|-----------|---------|-------------|-------------------|
| **Redis** | Cache, OTP, rate limit, session | Service, Middleware | Controller, Component, Repository |
| **Socket.IO** | Realtime notification, chat delivery | Dedicated SocketService, Middleware | Controller trực tiếp, Repository |
| **Elasticsearch** | Full-text search (doctor, specialty, blog) | Dedicated SearchService | Controller trực tiếp, Repository |
| **Cloudinary** | Image upload/delete | Dedicated UploadService | Controller trực tiếp, Component |

### Dependency Direction

```
Route → Controller → Service → Repository → Prisma
                         ↓
                   Redis / Socket / Elastic / Cloudinary
```

- Mũi tên chỉ hướng dependency cho phép. KHÔNG được đảo ngược.
- Controller KHÔNG import Repository.
- Repository KHÔNG import Service.
- Component KHÔNG import Axios.
- Hook KHÔNG import Prisma type.

### Forbidden Dependencies

| Từ | Đến | Lý do |
|----|-----|-------|
| Controller | Repository | Bỏ qua business layer |
| Controller | Prisma | Coupling trực tiếp với ORM |
| Component | Axios | Bỏ qua service abstraction |
| Component | Redux Store (trực tiếp) | Phải qua hook `useSelector`/`useDispatch` |
| Repository | Service | Circular dependency |
| Service | Controller | Circular dependency |
| Frontend | Prisma types | Coupling FE-BE, dùng shared DTO types |
| Socket handler | Repository | Bỏ qua business validation |

### MCP Figma Rule
Khi dùng MCP Figma thì không được tự gen ảnh mà lấy các icon, tài nguyên từ figma nhé (việc ảnh mock thì thay bằng placeholder và chờ data thật từ database nhé)


---

## 3. Folder Structure Rules

### Frontend — Feature-based

```
frontend/src/
├── app/
│   ├── App.tsx
│   ├── main.tsx
│   ├── router.tsx
│   └── store.ts
├── features/
│   ├── auth/
│   │   ├── components/
│   │   │   ├── LoginForm.tsx
│   │   │   └── RegisterForm.tsx
│   │   ├── hooks/
│   │   │   ├── useLogin.ts
│   │   │   └── useRegister.ts
│   │   ├── services/
│   │   │   └── auth.service.ts
│   │   ├── schemas/
│   │   │   └── auth.schema.ts
│   │   ├── types/
│   │   │   └── auth.types.ts
│   │   └── index.ts
│   ├── appointment/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── schemas/
│   │   ├── types/
│   │   └── index.ts
│   ├── doctor/
│   ├── specialty/
│   ├── patient-profile/
│   ├── schedule/
│   ├── review/
│   ├── chat/
│   ├── approval/
│   ├── blog/
│   ├── user-management/
│   ├── clinic-settings/
│   └── notification/
├── pages/
│   ├── public/
│   │   ├── HomePage.tsx
│   │   ├── DoctorListPage.tsx
│   │   ├── DoctorDetailPage.tsx
│   │   ├── SpecialtyListPage.tsx
│   │   ├── SpecialtyDetailPage.tsx
│   │   ├── BlogListPage.tsx
│   │   ├── BlogDetailPage.tsx
│   │   ├── BookingWizardPage.tsx
│   │   ├── AboutPage.tsx
│   │   ├── ContactPage.tsx
│   │   └── FAQPage.tsx
│   ├── patient/
│   │   ├── PatientDashboard.tsx
│   │   ├── PatientAppointments.tsx
│   │   ├── PatientProfile.tsx
│   │   └── PatientRelatives.tsx
│   ├── doctor/
│   │   ├── DoctorDashboard.tsx
│   │   ├── DoctorAppointmentList.tsx
│   │   ├── DoctorWorkSchedule.tsx
│   │   ├── DoctorChatPage.tsx
│   │   └── DoctorProfilePage.tsx
│   ├── receptionist/
│   │   ├── ReceptionistDashboard.tsx
│   │   ├── AppointmentManagement.tsx
│   │   ├── ReceptionistBooking.tsx
│   │   ├── DoctorScheduleView.tsx
│   │   ├── ReceptionistChatPage.tsx
│   │   └── ReceptionistProfile.tsx
│   └── admin/
│       ├── AdminDashboard.tsx
│       ├── SpecialtyManagement.tsx
│       ├── DoctorManagement.tsx
│       ├── ScheduleRulesManagement.tsx
│       ├── AdminAppointmentManagement.tsx
│       ├── ApprovalRequests.tsx
│       ├── UserManagement.tsx
│       ├── BlogManagement.tsx
│       ├── EmailPreviewPage.tsx
│       ├── ClinicInfo.tsx
│       └── SystemSettings.tsx
├── shared/
│   ├── components/
│   │   ├── ui/                   ← Button, Input, Modal, Table, Badge...
│   │   ├── layout/               ← Sidebar, Header, Footer, PageContainer
│   │   └── feedback/             ← Toast, Spinner, EmptyState, ErrorBoundary
│   ├── hooks/
│   │   ├── usePagination.ts
│   │   ├── useDebounce.ts
│   │   └── useMediaQuery.ts
│   ├── services/
│   │   └── axios.instance.ts
│   ├── types/
│   │   ├── api.types.ts          ← ApiResponse<T>, PaginatedResponse<T>
│   │   ├── enum.types.ts         ← AppointmentStatus, UserRole, BookingChannel
│   │   └── pagination.types.ts
│   ├── schemas/
│   │   └── pagination.schema.ts
│   └── constants/
│       ├── routes.ts
│       ├── query-keys.ts
│       └── config.ts
├── store/
│   ├── slices/
│   │   ├── authSlice.ts
│   │   └── uiSlice.ts
│   └── index.ts
└── styles/
    └── index.css
```

### Backend — Module-based

```
backend/src/
├── app.ts
├── server.ts
├── modules/
│   ├── auth/
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   ├── auth.repository.ts
│   │   ├── auth.routes.ts
│   │   ├── auth.dto.ts
│   │   ├── auth.validator.ts
│   │   └── auth.types.ts
│   ├── appointment/
│   │   ├── appointment.controller.ts
│   │   ├── appointment.service.ts
│   │   ├── appointment.repository.ts
│   │   ├── appointment.routes.ts
│   │   ├── appointment.dto.ts
│   │   ├── appointment.validator.ts
│   │   └── appointment.types.ts
│   ├── doctor/
│   ├── specialty/
│   ├── schedule/
│   ├── timeslot/
│   ├── patient-profile/
│   ├── review/
│   ├── approval/
│   ├── chat/
│   ├── user/
│   ├── blog/
│   ├── notification/
│   ├── upload/
│   └── clinic-settings/
├── infrastructure/
│   ├── database/
│   │   └── prisma.client.ts
│   ├── cache/
│   │   └── redis.client.ts
│   ├── search/
│   │   └── elastic.client.ts
│   ├── storage/
│   │   └── cloudinary.client.ts
│   └── realtime/
│       ├── socket.server.ts
│       └── socket.events.ts
├── middleware/
│   ├── auth.middleware.ts
│   ├── rbac.middleware.ts
│   ├── validate.middleware.ts
│   ├── rateLimiter.middleware.ts
│   └── errorHandler.middleware.ts
├── shared/
│   ├── types/
│   │   ├── api.types.ts
│   │   └── pagination.types.ts
│   ├── errors/
│   │   ├── AppError.ts
│   │   └── error-codes.ts
│   ├── constants/
│   │   └── config.ts
│   └── decorators/
│       └── catchAsync.ts
└── prisma/
    ├── schema.prisma
    └── migrations/
```

### Thư mục cấm tạo và thay thế

| Cấm tạo | Lý do | Thay thế bằng |
|----------|-------|---------------|
| `utils/` | Trở thành dump chứa mọi thứ không thuộc đâu | Đặt vào `shared/` với sub-folder rõ domain: `shared/date/`, `shared/format/` |
| `helpers/` | Tương tự `utils/`, không rõ ownership | Đặt vào feature module nếu chỉ dùng 1 feature, hoặc `shared/` nếu cross-feature |
| `misc/` | Không có nghĩa, không classify được | Mỗi file phải thuộc 1 module cụ thể |
| `common/` | Quá chung, mọi thứ đều có thể "common" | Dùng `shared/` với sub-categories rõ ràng |
| `lib/` | Mơ hồ giữa internal code và external wrapper | Dùng `infrastructure/` cho external service wrapper |

---

## 4. Single Responsibility Rules

### Quy tắc theo layer

| Layer | Trách nhiệm DUY NHẤT | Vi phạm nếu |
|-------|----------------------|-------------|
| **Controller** | Parse request → gọi service → format response | Chứa if/else business logic, gọi repository, query DB |
| **Service** | Orchestrate business logic | Format HTTP response, access `req`/`res`, import Prisma trực tiếp |
| **Repository** | Data access và query building | Chứa business validation, emit notification, format DTO |
| **Component** | Render UI dựa trên props/state | Chứa API call, data transform, business rule |
| **Hook** | Presentation logic + state wiring | Render JSX, chứa business rule thuộc backend |
| **Schema** | Validation definition | Chứa API call, side effect |
| **DTO** | Data shape definition | Chứa logic, method |

### Khi nào một file bị xem là làm quá nhiều việc

Bất kỳ điều kiện nào dưới đây → **bắt buộc refactor**:

| Tiêu chí | Ngưỡng | Hành động |
|----------|--------|-----------|
| Số dòng code | > 300 dòng (component), > 400 dòng (service/controller) | Tách thành sub-components hoặc sub-services |
| Số actor/role xử lý | > 1 actor trong cùng file | Tách theo actor: `PatientAppointmentService`, `DoctorAppointmentService` |
| Số lý do sửa | > 3 lý do độc lập có thể dẫn đến sửa file | Tách theo concern |
| Số import | > 15 import statements | File đang làm quá nhiều việc, tách module |
| Số parameter | > 5 parameter cho 1 function | Dùng object parameter hoặc tách function |
| Nesting depth | > 3 cấp if/else lồng nhau | Extract thành function riêng hoặc dùng early return |

### Ví dụ vi phạm và cách sửa

❌ **Vi phạm — Fat Controller:**
```
// appointment.controller.ts — 500 dòng
// Parse request + validate business rule + query DB + send email + format response
```

✅ **Đúng:**
```
Controller: parse request → gọi service (1 dòng) → format response
Service: validate business → gọi repository → gọi notification service
Repository: query DB
NotificationService: gửi email
```

---

## 5. Design Pattern Rules

### Bắt buộc (MUST)

| Pattern | Áp dụng ở đâu | Lý do |
|---------|---------------|-------|
| **Repository** | Backend — mọi data access | Tách business khỏi Prisma. Cho phép mock khi test |
| **Service Layer** | Backend — mọi business logic | Tách business khỏi controller. Reusable qua nhiều route |
| **Container/Presentational** | Frontend — mọi feature page | Page = container (logic), Component = presentational (UI) |
| **Custom Hook** | Frontend — mọi logic tái sử dụng | Tách logic khỏi component. Testable riêng |
| **DTO** | Backend — mọi API input/output | Không expose Prisma model trực tiếp. Control shape |
| **Provider** | Frontend — Auth, Theme, Socket context | Shared state cần inject từ app root |

### Nên dùng (SHOULD)

| Pattern | Áp dụng ở đâu | Khi nào |
|---------|---------------|---------|
| **Strategy** | Backend — notification (email/socket/sms), approval handling | Khi có > 2 variant cùng interface |
| **Factory** | Backend — tạo appointment (online vs reception), tạo user (patient vs doctor vs receptionist) | Khi creation logic phức tạp hoặc có nhiều variant |
| **Adapter** | Backend — Cloudinary wrapper, Elasticsearch wrapper, Redis wrapper | Khi wrap external service để tách coupling |
| **Facade** | Backend — BookingFacade orchestrate multiple services | Khi 1 use case cần gọi > 3 services |
| **Builder** | Backend — complex query building, email template building | Khi object construction có > 5 optional fields |
| **Observer** | Backend — Socket event emitting sau business action | Khi cần decouple side-effect khỏi main flow |

### Tránh dùng (AVOID)

| Pattern | Lý do | Thay bằng |
|---------|-------|-----------|
| **Singleton** (manual) | Khó test, hidden dependency | Module-level instance + dependency injection |
| **Abstract Factory** | Over-engineering cho project size này | Simple Factory function |
| **Mediator** | Quá phức tạp cho team size và domain scope | Direct service-to-service calls qua dependency injection |

### KHÔNG được dùng (FORBIDDEN)

| Pattern | Lý do |
|---------|-------|
| **God Object** | 1 class/object chứa mọi method của module |
| **Service Locator** | Hidden dependency, không explicit, khó trace |
| **Active Record** | Prisma đã là ORM, không cần model chứa cả data + behavior |
| **Inheritance chain > 2 levels** | Fragile base class problem, khó debug |

---

## 6. React Rules

### State Ownership

| State type | Owner | Quản lý bằng |
|------------|-------|-------------|
| Server state (appointment list, doctor list) | TanStack Query cache | `useQuery`, `useMutation` |
| Client state (auth user, theme) | Redux Toolkit | `createSlice`, `useSelector` |
| UI state (modal open, tab active, sidebar collapsed) | Component local | `useState` |
| Form state (input values, validation errors) | React Hook Form | `useForm`, `Controller` |
| URL state (filter, pagination, sort) | URL search params | `useSearchParams` |

### Render Strategy

| Tình huống | Strategy |
|------------|----------|
| List > 100 items | Virtualization (`react-virtual`) |
| Data từ API | Loading → Error → Empty → Data pattern bắt buộc |
| Conditional render phức tạp | Extract thành sub-component, không inline ternary > 3 dòng |
| Desktop/Mobile khác layout | `useMediaQuery` hook + component variant, không dùng CSS display:none cho structural differences |

### Memoization

| Dùng khi | KHÔNG dùng khi |
|----------|---------------|
| Component nhận callback prop mà re-render tốn kém | Mọi component (premature optimization) |
| Expensive computation trong render | Simple state derivation |
| Stable reference cho useEffect dependency | Primitive value |

### Form

- Tất cả form dùng React Hook Form + Zod resolver.
- Schema validation định nghĩa trong `features/{module}/schemas/`.
- Mỗi form field là controlled component qua `Controller` hoặc `register`.
- ✅ `useForm<BookingFormData>({ resolver: zodResolver(bookingSchema) })`.
- ❌ Manual `onChange` + `useState` cho từng field.

### Routing

- React Router v7 với route config tập trung trong `app/router.tsx`.
- Lazy loading cho mọi page: `React.lazy(() => import('./pages/...'))`.
- Route guard qua `ProtectedRoute` component check role.
- URL pattern theo spec: `/benh-nhan`, `/portal/bac-si`, `/portal/le-tan`, `/portal/admin`.

### Data Fetching

- TẤT CẢ API call qua TanStack Query.
- Query key convention: `[module, action, params]` → `['appointments', 'list', { status, date }]`.
- Mutation phải invalidate related queries on success.
- ✅ `useQuery({ queryKey: ['doctors', 'list', filters], queryFn: () => doctorService.getList(filters) })`.
- ❌ `useEffect(() => { axios.get('/api/doctors').then(setDoctors) }, [])`.

### Validation

- Frontend validation bằng Zod schema.
- Backend validation bằng Zod hoặc express-validator.
- Validation chạy ở CẢ HAI tầng. Frontend validation là UX, không thay thế backend validation.
- Schema chia sẻ type nhưng KHÔNG chia sẻ file giữa FE và BE.

### Các điều CẤM

| Cấm | Lý do | Thay bằng |
|-----|-------|-----------|
| Component > 250 dòng | Quá phức tạp, khó maintain | Tách sub-components |
| Prop drilling > 2 cấp | Khó trace data flow | Context, Redux, hoặc composition |
| Business logic trong UI component | Vi phạm separation of concerns | Custom hook hoặc service |
| `axios` trong component | Coupling trực tiếp với HTTP layer | Service + TanStack Query |
| `useEffect` để sync state | Race condition, infinite loop | Derived state, `useMemo`, hoặc event handler |
| Redux cho server state | Duplicate cache, stale data | TanStack Query |
| Inline style | Không maintainable, không reusable | TailwindCSS classes |
| `any` type | Bỏ qua toàn bộ type safety | Proper type definition hoặc `unknown` |
| Index file re-export tất cả | Barrel file gây circular dependency | Import trực tiếp từ file cụ thể |

---

## 7. Redux + React Query Rules

### Phân loại State

| Loại | Quản lý bằng | Ví dụ trong CarePlus |
|------|-------------|---------------------|
| **Server State** | TanStack Query | Danh sách appointment, doctor list, specialty list, schedule, review list, blog list |
| **Client State** | Redux Toolkit | Auth user info, user role, JWT token |
| **UI State** | `useState` / Redux (nếu global) | Sidebar collapsed, modal visibility, active tab, theme |
| **Form State** | React Hook Form | Booking wizard form, login form, profile edit form |
| **URL State** | `useSearchParams` | Filter params, pagination page, sort order |
| **Persistence** | localStorage qua Redux middleware | Auth token, theme preference |

### Quy tắc không duplicate

- ❌ Lưu `doctorList` vào cả Redux store VÀ TanStack Query cache.
- ✅ `doctorList` chỉ trong TanStack Query. Nếu cần global access → dùng `queryClient.getQueryData()`.

- ❌ Lưu `currentUser` trong cả Redux VÀ localStorage VÀ component state.
- ✅ `currentUser` trong Redux slice, persist vào localStorage qua middleware. Component đọc qua `useSelector`.

### Redux Toolkit Rules

- Mỗi slice chỉ quản lý 1 domain: `authSlice`, `uiSlice`.
- Không dùng Redux cho data thay đổi thường xuyên từ server (appointment list, doctor list).
- Async action chỉ cho auth flow (login, logout, refresh token).
- ✅ `authSlice` chứa: `user`, `token`, `isAuthenticated`, `role`.
- ❌ `appointmentSlice` chứa: `appointments`, `loading`, `error`, `filters`.

### TanStack Query Rules

- Query key phải unique và predictable.
- Convention: `const QUERY_KEYS = { appointments: { list: (params) => ['appointments', 'list', params], detail: (id) => ['appointments', 'detail', id] } }`.
- `staleTime` mặc định: 5 phút cho list, 10 phút cho detail.
- `gcTime` mặc định: 30 phút.
- Mutation `onSuccess` phải `invalidateQueries` related key.
- Optimistic update chỉ cho action đơn giản (toggle, status change), KHÔNG cho create phức tạp (booking wizard).

---

## 8. API Rules

### REST Convention

| Method | Mục đích | URL pattern |
|--------|----------|-------------|
| GET | Đọc resource | `/api/v1/appointments`, `/api/v1/appointments/:id` |
| POST | Tạo resource | `/api/v1/appointments` |
| PATCH | Cập nhật một phần | `/api/v1/appointments/:id` |
| PUT | Thay thế toàn bộ | Hạn chế dùng. Chỉ khi replace toàn bộ resource |
| DELETE | Xóa resource | `/api/v1/appointments/:id` |

### Versioning

- Prefix: `/api/v1/`.
- Khi breaking change → tạo `/api/v2/` và maintain v1 trong thời gian chuyển đổi.

### Response Envelope

Mọi API response PHẢI tuân theo format:

**Success:**
```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "totalPages": 10
  }
}
```

**Error:**
```json
{
  "success": false,
  "error": {
    "code": "SLOT_ALREADY_BOOKED",
    "message": "Khung giờ này đã được đặt bởi người khác",
    "details": [
      { "field": "timeSlotId", "message": "Slot không còn available" }
    ]
  }
}
```

### Error Codes

- Sử dụng error code dạng UPPER_SNAKE_CASE mô tả rõ lỗi.
- ✅ `SLOT_ALREADY_BOOKED`, `EMAIL_NOT_VERIFIED`, `ACCOUNT_LOCKED`, `SAME_DAY_BOOKING_EXISTS`.
- ❌ `ERROR_001`, `INVALID`, `FAILED`.

### DTO — Data Transfer Object

- KHÔNG return raw Prisma model. Luôn map qua DTO.
- ✅ `AppointmentResponseDto` chỉ chứa fields cần thiết cho client.
- ❌ Return trực tiếp `prisma.appointment.findFirst({ include: { patient: true, doctor: true } })`.

- Input DTO: `CreateAppointmentDto`, `UpdateProfileDto`.
- Output DTO: `AppointmentResponseDto`, `DoctorListItemDto`.

### Pagination

- Query params: `?page=1&limit=10`.
- Default: `page=1`, `limit=10`, max `limit=100`.
- Response `meta` bắt buộc có: `page`, `limit`, `total`, `totalPages`.

### Filter và Sort

- Filter qua query params: `?status=CONFIRMED&doctorId=d1&date=2026-06-15`.
- Sort: `?sortBy=appointmentDate&sortOrder=asc`.
- Search: `?search=keyword` (full-text qua Elasticsearch khi có, fallback SQL LIKE).
- KHÔNG dùng POST body cho filter/sort trên GET request.

### OpenAPI

- Mọi endpoint phải có JSDoc annotation hoặc OpenAPI comment để generate documentation.
- Response type phải match DTO definition.

---

## 9. Prisma Rules

### Prisma KHÔNG phải business layer

- Prisma là data access tool. Business logic thuộc Service layer.
- ✅ Repository gọi `prisma.appointment.findMany({ where, include })` → Service validate kết quả.
- ❌ Viết business validation trong Prisma middleware.

### Transaction

- Dùng `prisma.$transaction()` khi cần atomic operation cross-table.
- Bắt buộc transaction cho:
  - Tạo appointment (tạo appointment + update timeslot status + update schedule).
  - Hủy appointment (update appointment status + release timeslot + update noShowCount nếu no-show).
  - Tạo user + doctor profile.
- ✅ `prisma.$transaction([createAppointment, updateTimeSlot])`.
- ❌ Gọi 2 query riêng biệt rồi "hy vọng" cả hai đều thành công.

### Include/Select

- Mặc định dùng `select` thay vì `include` để lấy đúng fields cần thiết.
- Chỉ dùng `include` khi cần toàn bộ relation.
- ✅ `prisma.appointment.findMany({ select: { id: true, code: true, status: true, doctor: { select: { name: true } } } })`.
- ❌ `prisma.appointment.findMany({ include: { doctor: true, patient: true, schedule: true, timeSlot: true } })` khi chỉ cần doctor name.

### Migration

- Mỗi schema change phải có migration file.
- Không sửa migration file đã được apply.
- Migration name rõ ràng: `add_no_show_count_to_user`, `create_approval_request_table`.
- Chạy `prisma migrate dev` trên dev, `prisma migrate deploy` trên staging/production.

### Index

- Bắt buộc index cho:
  - Foreign key columns.
  - Columns thường xuyên filter: `status`, `appointmentDate`, `doctorId`, `patientId`.
  - Composite index cho query pattern phổ biến: `@@index([doctorId, appointmentDate])`.
- Không index column ít query hoặc bảng nhỏ.

### Soft Delete

- Mọi entity dùng soft delete qua field `isActive` hoặc `deletedAt`.
- Repository method mặc định filter `isActive = true` hoặc `deletedAt = null`.
- ✅ `where: { isActive: true, ...filters }` mặc định trong repository.
- ❌ Hard delete trừ khi là data tạm (OTP, session expired).

### Query Optimization

- Không dùng `findMany()` không giới hạn. Luôn có `take` + `skip`.
- Dùng `cursor`-based pagination cho dataset lớn (> 10,000 records).
- Dùng `prisma.$queryRaw()` chỉ khi Prisma Client không hỗ trợ query pattern cần thiết VÀ có benchmark chứng minh performance gain.

---

## 10. Database Rules

### Naming Convention

| Loại | Convention | Ví dụ |
|------|-----------|-------|
| Table | PascalCase, singular | `User`, `Appointment`, `TimeSlot` |
| Column | camelCase | `appointmentDate`, `noShowCount`, `createdAt` |
| Foreign key column | `{relation}Id` | `doctorId`, `patientId`, `scheduleId` |
| Index | `idx_{table}_{columns}` | `idx_appointment_doctorId_date` |
| Enum | PascalCase type, UPPER_SNAKE_CASE value | `AppointmentStatus.CONFIRMED` |

### Foreign Key

- Mọi relation phải có FK constraint.
- FK phải có `onDelete` behavior rõ ràng: `CASCADE`, `SET_NULL`, hoặc `RESTRICT`.
- ✅ `doctorId String @relation(references: [id], onDelete: Restrict)`.
- ❌ FK không có `onDelete` → Prisma dùng default behavior, không explicit.

### Index Strategy

- FK column: LUÔN có index.
- Status column: index nếu bảng > 1000 records.
- Date column dùng filter: index.
- Composite index cho query pattern: `(doctorId, appointmentDate)`, `(patientId, status)`.
- KHÔNG index boolean column đơn lẻ (low cardinality).

### Audit Fields

- Mọi table PHẢI có: `createdAt DateTime @default(now())`, `updatedAt DateTime @updatedAt`.
- Table có business lifecycle PHẢI có status field.
- Table cần audit trail: thêm `createdBy`, `updatedBy`.

### Timestamp

- Lưu UTC trong database.
- Convert timezone ở application layer (frontend).
- Format hiển thị: `dd/MM/yyyy HH:mm` (Vietnam timezone UTC+7).

### Normalization

- Bảng chính normalize đến 3NF.
- Denormalize chỉ khi có performance requirement đo được.
- Denormalized field phải có comment giải thích lý do.
- ✅ `specialtyName` trên Doctor table (tránh join khi list). Comment: `// denormalized: avoid join on doctor list query`.
- ❌ Duplicate data không có lý do.

### Cấm

| Cấm | Lý do | Thay bằng |
|-----|-------|-----------|
| `SELECT *` | Lấy dư data, chậm | Explicit `select` fields |
| N+1 query | Performance disaster | `include`/`select` relation, hoặc batch query |
| Store JSON blob cho structured data | Không query được, không validate được | Tạo table riêng với proper columns |
| Nullable FK không có lý do | Mơ hồ data integrity | Default value hoặc required relation |

---

## 11. Redis Rules

### Mục đích sử dụng

| Use case | Key pattern | TTL | Ví dụ |
|----------|-------------|-----|-------|
| API response cache | `cache:{module}:{identifier}` | 5–15 phút | `cache:doctors:list:page1` |
| OTP verification | `otp:{type}:{email}` | 5 phút | `otp:email-verify:user@email.com` |
| Rate limiting | `ratelimit:{action}:{identifier}` | 1 phút | `ratelimit:login:192.168.1.1` |
| Session/token blacklist | `blacklist:token:{jti}` | Bằng token remaining TTL | `blacklist:token:abc123` |
| Slot lock (booking) | `lock:slot:{slotId}` | 5 phút | `lock:slot:ts-001` |

### Key Naming Convention

- Format: `{purpose}:{module}:{identifier}`.
- Delimiter: dấu `:`.
- Lowercase.
- ✅ `cache:appointments:list:doctor-d1:date-20260615`.
- ❌ `appointmentList`, `CACHE_DOCTOR`, `data_1`.

### TTL — Bắt buộc

- Mọi key PHẢI có TTL. Không có key vĩnh viễn.
- Cache: 5–15 phút tùy tần suất thay đổi.
- OTP: 5 phút.
- Rate limit window: 1 phút.
- Slot lock: 5 phút (thời gian user hoàn tất booking wizard).

### Redis KHÔNG phải source of truth

- Nếu Redis mất data → hệ thống phải hoạt động bình thường (cache miss → query DB).
- KHÔNG lưu data chỉ có trong Redis. Mọi data quan trọng phải persist trong MySQL.
- ✅ Cache doctor list → miss → query MySQL → set cache.
- ❌ Lưu booking confirmation chỉ trong Redis.

### Cache Invalidation

- Mutation thành công → xóa related cache key.
- Dùng pattern delete: `cache:appointments:*` khi appointment data thay đổi.
- KHÔNG dùng TTL quá dài rồi "hy vọng" data vẫn đúng.

---

## 12. Socket Rules

### Event Naming Convention

- Format: `{module}:{action}` — lowercase, dấu `:` phân cách.
- ✅ `appointment:created`, `appointment:status-changed`, `chat:message-received`, `notification:new`.
- ❌ `newAppointment`, `MSG_RECEIVED`, `update`.

### Realtime Flow

| Event | Trigger | Receiver |
|-------|---------|----------|
| `appointment:created` | Patient/Receptionist tạo lịch | Doctor, Admin |
| `appointment:status-changed` | Status transition (check-in, complete, cancel, no-show) | Patient, Doctor, Receptionist, Admin (theo role liên quan) |
| `chat:message-received` | User gửi tin nhắn | Conversation participants |
| `chat:typing` | User đang gõ | Conversation participants |
| `approval:new-request` | Doctor gửi yêu cầu nghỉ/hủy | Admin |
| `approval:status-changed` | Admin duyệt/từ chối | Doctor |
| `notification:new` | Bất kỳ event cần notify | Target user |

### Architecture

- Socket server chạy cùng Express server.
- Socket handler KHÔNG chứa business logic. Chỉ emit/listen events.
- Business logic xảy ra trong Service → Service gọi `socketService.emit()` sau khi hoàn tất.
- ✅ `appointmentService.create() → success → socketService.emit('appointment:created', data)`.
- ❌ Socket handler nhận event → trực tiếp gọi repository → save DB.

### Room Strategy

- Mỗi user join room theo userId: `user:{userId}`.
- Conversation room: `conversation:{conversationId}`.
- Role-based broadcast: `role:admin`, `role:receptionist`.

### Reconnect

- Client phải handle reconnect tự động.
- Sau reconnect → re-join rooms → fetch missed events (qua API, không qua socket history).

### Cấm

| Cấm | Lý do |
|-----|-------|
| Business logic trong socket handler | Vi phạm architecture layer |
| Gửi sensitive data qua socket không authenticated | Security risk |
| Socket thay thế REST API cho CRUD | Socket cho realtime push, REST cho request/response |
| Dùng socket cho initial data load | Dùng REST API + TanStack Query |

---

## 13. Elasticsearch Rules

### MySQL là source of truth

- Elasticsearch là search index, KHÔNG phải primary datastore.
- Nếu Elasticsearch down → fallback về MySQL `LIKE` query.
- Data trong Elasticsearch phải sync từ MySQL, không phải ngược lại.

### Sync Pattern

- Sync trigger: Sau mỗi create/update/delete thành công trong MySQL.
- Service layer gọi `searchService.index()` sau khi repository persist thành công.
- Async sync: dùng queue hoặc event-based. Không block API response.
- Reindex: có job cho phép full reindex từ MySQL.

### Index Strategy

| Index | Source table | Fields indexed | Use case |
|-------|-------------|---------------|----------|
| `doctors` | Doctor + User + Specialty | name, specialtyName, description, title | Tìm bác sĩ theo tên, chuyên khoa |
| `specialties` | Specialty | name, description | Tìm chuyên khoa |
| `blogs` | Blog | title, content, tags | Tìm bài viết |

### Search Strategy

- Dùng `multi_match` cho search bar.
- Dùng `filter` (not `query`) cho exact match (status, date range).
- Highlight search terms trong kết quả.
- Pagination qua `from` + `size`, max 10,000 results.

### Cấm

| Cấm | Lý do |
|-----|-------|
| Transaction trong Elasticsearch | ES không hỗ trợ ACID transaction |
| Dùng ES làm primary datastore | Không đảm bảo data durability |
| Sync blocking API response | Giảm API performance |
| Index toàn bộ table | Chỉ index fields cần search |

---

## 14. Cloudinary Rules

### Upload Flow

```
Client → Backend API (multer memory storage) → UploadService → Cloudinary SDK → Return URL
```

- Client KHÔNG upload trực tiếp lên Cloudinary. Luôn qua backend.
- Multer dùng memory storage, KHÔNG lưu file vào disk.
- UploadService trả về Cloudinary URL + public_id.
- Lưu URL và public_id vào database.
- **Bắt buộc**: Toàn bộ tài nguyên ảnh trong hệ thống (avatar, ảnh bài viết, ảnh phòng khám) đều phải sử dụng Cloudinary. Nghiêm cấm lưu trữ hình ảnh dưới dạng raw binary hoặc chuỗi base64 trực tiếp vào database.
- **Tối ưu hóa tránh ảnh rác (Orphan assets)**: Đối với các ảnh đại diện (thumbnail) hoặc ảnh đi kèm form nhập liệu, frontend chỉ thực hiện upload lên Cloudinary khi người dùng bấm nút Save/Gửi và xác nhận tạo bài viết/tài liệu thành công.

### Folder Structure trên Cloudinary

```
careplus/
├── avatars/{userId}/
├── blog/{postId}/
└── clinic/
```

### Delete Cleanup

- Khi xóa resource có image → gọi `cloudinary.uploader.destroy(public_id)`.
- Khi update image → xóa image cũ trước khi upload mới.
- Có cleanup job cho orphaned images (images có public_id nhưng không còn reference trong DB).

### Cấm

| Cấm | Lý do |
|-----|-------|
| Lưu file vào local disk (`uploads/` folder) | Không scalable, mất khi deploy |
| Upload trực tiếp từ frontend | Security risk, không kiểm soát file type/size |
| Lưu Cloudinary credentials ở frontend | Secret exposure |
| Không xóa image cũ khi replace | Orphaned resource, tốn storage |

---

## 15. Security Rules

### JWT

- Access token: short-lived (15 phút).
- Refresh token: long-lived (7 ngày), lưu httpOnly cookie.
- Token payload: `{ userId, role, jti }`. KHÔNG lưu sensitive data (email, phone).
- Blacklist revoked token trong Redis (key: `blacklist:token:{jti}`, TTL = remaining token life).
- ✅ Verify token mỗi request qua middleware.
- ❌ Lưu token trong localStorage (XSS vulnerable).

### RBAC — Role-Based Access Control

| Role | Accessible routes |
|------|------------------|
| GUEST | Public pages, login, register |
| PATIENT | `/benh-nhan/**`, `/dat-lich` |
| DOCTOR | `/portal/bac-si/**` |
| RECEPTIONIST | `/portal/le-tan/**` |
| ADMIN | `/portal/admin/**` |

- RBAC check ở CÁCH hai tầng: frontend route guard + backend middleware.
- Backend middleware: `authorize('ADMIN', 'RECEPTIONIST')` cho endpoint cần multiple roles.
- ✅ `router.patch('/appointments/:id/check-in', authenticate, authorize('RECEPTIONIST'), checkInController)`.
- ❌ Check role bên trong controller body.

### Input Validation

- Validate TẤT CẢ input tại backend, bất kể frontend đã validate.
- Dùng Zod schema cho validation.
- Validate type, format, length, range.
- ✅ `appointmentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/)`.
- ❌ Trust frontend data, cast trực tiếp vào query.

### Sanitization

- Sanitize HTML trong user input (comment, reason, note) để chống XSS.
- Escape SQL special characters (Prisma parameterized queries đã handle).
- Strip whitespace leading/trailing.

### Secret Management

- Tất cả secrets trong `.env`. KHÔNG hardcode.
- `.env` trong `.gitignore`. Có `.env.example` với placeholder.
- Secrets: `DATABASE_URL`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, `REDIS_URL`, `CLOUDINARY_*`, `ELASTICSEARCH_*`, `SMTP_*`.

### Rate Limiting

| Endpoint | Limit | Window |
|----------|-------|--------|
| POST `/auth/login` | 5 requests | 1 phút |
| POST `/auth/register` | 3 requests | 1 phút |
| POST `/auth/forgot-password` | 3 requests | 5 phút |
| POST `/appointments` | 10 requests | 1 phút |
| Global API | 100 requests | 1 phút |

### Audit Log

- Log mọi action thay đổi data: create, update, delete, status change.
- Log format: `{ userId, action, resource, resourceId, timestamp, ip, changes }`.
- ✅ Log khi admin lock/unlock user, approve/reject request, change appointment status.
- ❌ Log GET request (quá nhiều, không cần thiết).

### OWASP Cơ Bản

| Risk | Mitigation |
|------|-----------|
| SQL Injection | Prisma parameterized queries. Không raw SQL trừ khi benchmarked |
| XSS | Sanitize input, React auto-escapes JSX output |
| CSRF | SameSite cookie, CORS whitelist |
| Broken Auth | JWT + refresh token rotation, blacklist |
| Sensitive Data Exposure | HTTPS only, không log sensitive data |
| Security Misconfiguration | Helmet middleware, disable `x-powered-by` |

---

## 16. Testing Rules

### Test Pyramid

| Level | Tỷ lệ | Tool | Scope |
|-------|--------|------|-------|
| Unit | 70% | Vitest (FE), Jest (BE) | Function, hook, service method, utility |
| Integration | 20% | Vitest + MSW (FE), Jest + Supertest (BE) | API endpoint, hook + service, component + hook |
| E2E | 10% | Playwright | Critical user flow: đặt lịch, login, check-in |

### Test Naming Convention

```
describe('[Module] [Unit]', () => {
  it('should [expected behavior] when [condition]', () => {});
});
```

- ✅ `describe('AppointmentService createAppointment', () => { it('should throw SLOT_ALREADY_BOOKED when slot is taken', ...) })`.
- ❌ `describe('test1', () => { it('works', ...) })`.

### Coverage Target

| Layer | Minimum |
|-------|---------|
| Service (business logic) | 80% |
| Repository | 60% |
| Controller | 60% |
| Custom Hook | 70% |
| Utility/shared | 90% |
| Component (UI) | 50% |

### Mocking Strategy

| Mock gì | Bằng gì | Khi nào |
|---------|---------|---------|
| API response | MSW (frontend), jest.mock (backend) | Unit/integration test |
| Database | In-memory SQLite hoặc jest.mock repository | Service unit test |
| Redis | jest.mock redis client | Service unit test |
| External service (Cloudinary, email) | jest.mock adapter | Luôn luôn trong test |
| Time/Date | jest.useFakeTimers | Test liên quan time (slot expiry, TTL) |

### Definition of Done

Một feature được coi là DONE khi:

- [ ] Unit test cho mọi service method.
- [ ] Integration test cho mọi API endpoint.
- [ ] Happy path + error path đều có test.
- [ ] Coverage đạt ngưỡng tối thiểu.
- [ ] Test pass trên CI.
- [ ] Không có `test.skip` hoặc `test.todo` cho critical path.

---

## 17. Performance Rules

### Cache Strategy

| Data | Cache location | TTL | Invalidation trigger |
|------|---------------|-----|---------------------|
| Doctor list | Redis + TanStack Query | 10 phút | Doctor profile update |
| Specialty list | Redis + TanStack Query | 30 phút | Specialty CRUD |
| Available slots | TanStack Query only | 1 phút | Booking created/cancelled |
| Blog list | Redis + TanStack Query | 15 phút | Blog CRUD |
| Clinic info | Redis + TanStack Query | 1 giờ | Admin update |

### Pagination

- Mọi list endpoint PHẢI có pagination. Không trả về unbounded list.
- Default: `page=1, limit=10`.
- Max: `limit=100`.
- Frontend: infinite scroll cho mobile, table pagination cho desktop.

### Lazy Loading

- Mọi page component: `React.lazy()` + `Suspense`.
- Image: `loading="lazy"` attribute.
- Review list trên doctor detail: lazy load 5 items/lần.
- Heavy library (chart, calendar): dynamic import.

### Memoization

- `useMemo`: cho expensive derived data (filter/sort/transform array > 100 items).
- `useCallback`: cho callback truyền vào memoized child component.
- `React.memo`: cho component nhận stable props nhưng parent re-render thường xuyên.
- KHÔNG memo tất cả. Đo trước, optimize sau.

### Query Optimization

- N+1 detection: review mọi loop có query bên trong.
- ✅ `prisma.appointment.findMany({ include: { doctor: { select: { name: true } } } })` — 1 query.
- ❌ `appointments.forEach(a => prisma.doctor.findUnique({ where: { id: a.doctorId } }))` — N queries.
- Index cho columns trong WHERE, ORDER BY, JOIN.
- EXPLAIN ANALYZE cho query chậm > 100ms.

### Debounce

| Action | Debounce time |
|--------|-------------|
| Search input (doctor, appointment) | 300ms |
| Filter change | 300ms |
| Window resize | 200ms |
| Scroll event | 100ms |

### Virtualization

- List > 100 items hiển thị cùng lúc: bắt buộc virtualize.
- Appointment list, doctor schedule calendar cells.
- Dùng `@tanstack/react-virtual` hoặc `react-window`.

---

## 18. Git Workflow


### Commit Convention

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

| Type | Mục đích |
|------|----------|
| `feat` | Feature mới |
| `fix` | Bug fix |
| `refactor` | Refactor code, không đổi behavior |
| `test` | Thêm/sửa test |
| `docs` | Documentation |
| `chore` | Build, config, dependency |
| `style` | Format, whitespace, không đổi logic |
| `perf` | Performance improvement |

- Scope: module name (`auth`, `appointment`, `doctor`, `schedule`, `chat`).
- ✅ `feat(appointment): add cancellation request flow for overdue bookings`.
- ❌ `update code`, `fix bug`, `wip`.


---

## 19. Documentation Rules

### README.md

Mỗi thư mục gốc (`frontend/`, `backend/`) phải có README.md chứa:

- Mô tả ngắn project.
- Prerequisites (Node version, pnpm, MySQL, Redis).
- Setup instructions (step-by-step).
- Available scripts.
- Environment variables (reference `.env.example`).

### Architecture Decision Records (ADR)

- Lưu trong `docs/adr/`.
- Format: `{number}-{title}.md`.
- Mỗi ADR chứa: Context, Decision, Consequences.
- Tạo ADR khi: chọn library, thay đổi architecture, thêm infrastructure component.
- ✅ `docs/adr/001-use-tanstack-query-for-server-state.md`.
- ❌ Quyết định architecture chỉ nói miệng, không ghi lại.

### API Documentation

- OpenAPI/Swagger spec cho mọi endpoint.
- Mỗi endpoint có: description, request schema, response schema, error codes.
- Cập nhật khi thêm/sửa endpoint.

### Module Documentation

- Mỗi module backend có comment block đầu file chính (service) mô tả:
  - Module purpose.
  - Key business rules.
  - Dependencies.

### Decision Records

- Khi có trade-off hoặc deviation từ convention → document lý do trong code comment hoặc ADR.
- ✅ `// Denormalized specialtyName here to avoid join. See ADR-003`.
- ❌ Denormalize data không giải thích.

---

## 20. Agent Self Review

### Checklist bắt buộc trước khi sinh code

Trước khi viết hoặc submit bất kỳ code nào, Agent/Developer PHẢI tự hỏi:

| # | Câu hỏi | Nếu SAI |
|---|---------|---------|
| 1 | Code này nằm đúng layer? (Controller chỉ request/response? Service chỉ business? Repository chỉ data?) | Di chuyển code sang đúng layer |
| 2 | File/function này chỉ có 1 lý do thay đổi? (SRP) | Tách thành nhiều file/function |
| 3 | Có logic nào bị duplicate với file khác? | Extract thành shared function/module |
| 4 | Code này có scale được khi thêm feature mới? | Refactor thành extensible pattern (strategy, factory) |
| 5 | Code này test được không? (có thể mock dependency?) | Inject dependency, tách side effect |
| 6 | Developer mới có hiểu code này trong 5 phút? | Đổi tên, thêm comment, đơn giản hóa |
| 7 | Có dùng đúng state management? (server state → Query, client → Redux, UI → local) | Chuyển state sang đúng nơi |
| 8 | Response có đúng envelope format? | Wrap trong standard response |
| 9 | Error có đúng format + error code? | Dùng AppError + error code constant |
| 10 | Có pagination cho list endpoint? | Thêm pagination |
| 11 | Input đã validate ở backend? | Thêm validator middleware |
| 12 | Có security concern? (auth, RBAC, sanitize) | Thêm middleware, validate |
| 13 | File > 300 dòng? | Bắt buộc refactor, tách file |
| 14 | Có `any` type? | Thay bằng proper type |
| 15 | Có `console.log`? | Xóa hoặc thay bằng proper logger |

**Nếu bất kỳ câu nào trả lời SAI → refactor TRƯỚC KHI submit. Không ngoại lệ.**

---

## 21. Anti Patterns

### Danh sách Anti-Pattern và cách xử lý

---

#### God Object

**Triệu chứng:** Một class/module chứa > 500 dòng, > 10 methods, xử lý > 3 concerns khác nhau.

**Ví dụ vi phạm:** `AppointmentManager` vừa validate, vừa query DB, vừa gửi email, vừa emit socket event.

**Cách xử lý:** Tách theo concern: `AppointmentService` (business), `AppointmentRepository` (data), `NotificationService` (email), `SocketService` (realtime).

---

#### Fat Controller

**Triệu chứng:** Controller > 50 dòng cho 1 handler, chứa business logic, gọi repository trực tiếp.

**Ví dụ vi phạm:** Controller check appointment status, validate business rule, update 3 tables, gửi email, return response.

**Cách xử lý:** Controller chỉ: parse request → gọi service (1 dòng) → format response. Toàn bộ logic vào service.

---

#### Massive Component

**Triệu chứng:** React component > 250 dòng, mix UI + logic + API call.

**Ví dụ vi phạm:** `BookingWizard.tsx` 800 dòng chứa 5 step, form logic, API call, validation.

**Cách xử lý:** Tách mỗi step thành component riêng, logic vào `useBookingWizard` hook, API vào `booking.service.ts`.

---

#### Circular Dependency

**Triệu chứng:** Module A import Module B, Module B import Module A. Build warning hoặc runtime error.

**Ví dụ vi phạm:** `AppointmentService` import `DoctorService`, `DoctorService` import `AppointmentService`.

**Cách xử lý:** Extract shared logic vào module thứ 3, hoặc dùng event-based communication.

---

#### Business in UI

**Triệu chứng:** Component chứa business rule (check noShowCount >= 3, validate slot availability).

**Ví dụ vi phạm:** `SlotGrid.tsx` chứa logic filter slot theo status, check time expiry.

**Cách xử lý:** Business logic thuộc backend service. Frontend chỉ render data đã được process.

---

#### Over Abstraction

**Triệu chứng:** 5 files cho 1 function đơn giản. Interface cho class chỉ có 1 implementation. Abstract factory cho 1 variant.

**Ví dụ vi phạm:** `IAppointmentRepositoryFactory` → `AppointmentRepositoryFactoryImpl` → `AppointmentRepository` — khi chỉ có 1 loại appointment.

**Cách xử lý:** YAGNI. Thêm abstraction khi có nhu cầu thực tế (> 1 implementation, > 1 variant).

---

#### Premature Optimization

**Triệu chứng:** Memo tất cả component, cache tất cả query, virtualize list 10 items.

**Ví dụ vi phạm:** `React.memo(Button)`, redis cache cho endpoint gọi 1 lần/ngày.

**Cách xử lý:** Đo trước bằng profiler. Chỉ optimize khi có benchmark chứng minh bottleneck.

---

#### Copy Paste

**Triệu chứng:** Cùng logic xuất hiện ở > 2 nơi. Sửa 1 chỗ quên sửa chỗ khác.

**Ví dụ vi phạm:** Validation logic cho appointment date lặp trong `PatientBooking`, `ReceptionistBooking`, `AdminAppointment`.

**Cách xử lý:** Extract thành shared schema, shared service method, hoặc shared hook.

---

#### Magic Number

**Triệu chứng:** Số xuất hiện trong code không có tên, không có giải thích.

**Ví dụ vi phạm:** `if (noShowCount >= 3)`, `setTimeout(fn, 1500)`, `take: 5`.

**Cách xử lý:** Dùng named constant: `MAX_NO_SHOW_BEFORE_LOCK = 3`, `SIMULATED_REPLY_DELAY_MS = 1500`, `UPCOMING_APPOINTMENTS_LIMIT = 5`.

---

#### Singleton Abuse

**Triệu chứng:** Dùng Singleton pattern cho service/repository thay vì dependency injection.

**Ví dụ vi phạm:** `AppointmentService.getInstance()` — không test được, hidden dependency.

**Cách xử lý:** Module-level instance export + constructor injection cho dependency.

---

#### Service Explosion

**Triệu chứng:** Quá nhiều service nhỏ (< 50 dòng mỗi service), mỗi service 1–2 methods.

**Ví dụ vi phạm:** `SlotValidationService`, `SlotAvailabilityService`, `SlotBookingService`, `SlotExpiryService` — khi tất cả liên quan đến TimeSlot business logic.

**Cách xử lý:** Gom vào `TimeSlotService` với methods rõ ràng. Tách khi vượt 400 dòng.

---

#### Repository Explosion

**Triệu chứng:** Mỗi query pattern 1 repository method riêng, repository > 30 methods.

**Ví dụ vi phạm:** `findByDoctorId()`, `findByDoctorIdAndDate()`, `findByDoctorIdAndDateAndStatus()`, `findByDoctorIdAndDateAndStatusAndShift()`.

**Cách xử lý:** Dùng filter object: `findMany(filters: AppointmentFilter)` với type-safe filter DTO.

---

> **Tài liệu này là luật bắt buộc. Mọi code không tuân thủ sẽ bị reject trong code review.**
