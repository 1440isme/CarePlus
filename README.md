# CarePlus Clinic — International General Clinic Appointment System

[![Project Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](https://github.com/1440isme/CarePlus)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D20.x-green.svg)](https://nodejs.org/)
[![Database](https://img.shields.io/badge/database-MySQL%20%7C%20MariaDB-orange.svg)](https://www.mysql.com/)
[![ORM](https://img.shields.io/badge/ORM-Prisma%207-lightblue.svg)](https://www.prisma.io/)
[![Search](https://img.shields.io/badge/search-Elasticsearch-yellow.svg)](https://www.elastic.co/)
[![Cache](https://img.shields.io/badge/cache-Redis-red.svg)](https://redis.io/)
[![Clean Architecture](https://img.shields.io/badge/architecture-Clean--Layered-brightgreen.svg)](./AGENT.md)

**CarePlus Clinic** is a comprehensive clinical online booking system. The project is implemented as a **Monorepo** using **Clean Architecture** on the Backend and a **Feature-based** modular architecture on the Frontend.

The system integrates 5 dedicated Portals along with Full-text Search, Memory Caching, and Real-time Communication.

---

## 🗺️ System Architecture

The project follows Clean Architecture principles, ensuring complete decoupling between database layers, business logic, and presentation layers.

```mermaid
graph TD
    UI[UI Components] --> FH[Custom Hooks]
    FH --> RTK[Redux Toolkit Client State]
    FH --> TSQ[TanStack Query Server State]
    TSQ --> AX[Axios Instance]

    AX --> API[Express API Server]

    API --> Routes[Routes & Middlewares]
    Routes --> Controllers[Controllers]
    Controllers --> Services[Business Services]
    Services --> Repositories[Repositories]

    Repositories --> Prisma[Prisma ORM & Driver Adapter]
    Prisma --> DB[MySQL / MariaDB Database]
    Services --> Redis[Redis Cache & OTP]
    Services --> ES[Elasticsearch Search Engine]
    Services --> Socket[Socket.IO Realtime Server]
    Services --> Cloudinary[Cloudinary Image Storage]
```

---

## 🌟 5 Main Portals

1. **Public Website**:
   - Browse medical specialties and search for doctors using multi-criteria filters (specialty, working shift).
   - Interactive multi-step Booking Wizard to schedule appointments for patients or their relatives.
2. **Patient Portal**:
   - Register account, verify via OTP sent to email, and reset/recover passwords.
   - Manage relative profiles (Relative Profiles).
   - Track appointment history, view booking status, write reviews, and submit ratings for doctors.
   - Chat in real-time with receptionists or medical support.
3. **Doctor Portal**:
   - Register and manage weekly working shifts (morning, afternoon, or all-day).
   - Submit leave requests and monitor administrative approval status.
   - Access the queue of booked patients and chat directly with them.
4. **Receptionist Portal**:
   - Welcome patients at the desk and check them in for appointments.
   - Create direct walk-in bookings for patients who arrive without online appointments.
   - Manage real-time chat requests from patients on the public site.
5. **Admin Portal**:
   - Manage global system configurations (booking slot durations, maximum cancellations, etc.).
   - Process leave and appointment cancellation requests submitted by doctors.
   - Manage user profiles (Doctors, Receptionists, Patients) and system access roles.

---

## 🛠️ Tech Stack

### Frontend (Client-side)
* **Core:** React 19 (JavaScript ES6+, Vite)
* **State Management:** 
  * Server State: **TanStack Query (React Query) v5** (Handles auto-caching, sync, and revalidation of schedules, appointments, and reviews).
  * Client State: **Redux Toolkit** (Manages authorization data, tokens, and portal profiles).
  * UI State: Component-level `useState` & `useContext`.
* **Forms & Validation:** React Hook Form + Zod Validator.
* **Styling:** Tailwind CSS v4 + Lucide Icons + Recharts (analytical dashboard graphs).
* **Realtime:** Socket.IO Client.

### Backend (Server-side)
* **Core:** Node.js, Express.js (Clean Architecture layering).
* **ORM:** **Prisma 7** (Utilizes `@prisma/adapter-mariadb` with the raw `mariadb` driver for highly optimized connection performance).
* **Database & Caching:** MySQL / MariaDB + **Redis** (Handles caching, OTP storage, and rate-limiting).
* **Search Engine:** **Elasticsearch 8** (Indexes doctor metadata, specialties, and blogs for fast full-text searching).
* **File Storage:** Cloudinary SDK (Handles avatar uploads and clinic records).
* **Authentication:** JSON Web Tokens (Access Token & Refresh Token) + Bcrypt hashing.
* **Realtime:** Socket.IO Server (Handles chat rooms and live status updates).

### Testing & Quality Assurance
* **Integration Tests:** Mocha, Chai, Selenium Webdriver (Automated E2E Testing).
* **Linter:** ESLint.

---

## 📁 Monorepo Folder Structure

```
CarePlus/
├── backend/                      # --- BACKEND SUB-PROJECT ---
│   ├── prisma/                   # Database migrations & Prisma definitions
│   │   ├── schema.prisma         # Prisma 7 Schema (excludes hardcoded DATABASE_URL)
│   │   └── migrations/           # SQL migration version history
│   ├── src/
│   │   ├── infrastructure/       # External services (Database, Cache, Search, Mail, Realtime)
│   │   ├── middleware/           # Data sanitization, Auth guards, Role verification
│   │   ├── modules/              # Domain-Driven Modules (auth, doctor, schedule, appointment, chat, review)
│   │   │   ├── domain.controller.js # Receives request, formats HTTP responses
│   │   │   ├── domain.service.js    # Core Business Logic
│   │   │   ├── domain.repository.js # Direct DB interactions via Prisma
│   │   │   └── domain.types.js      # Data validation schemas (Zod)
│   │   ├── app.js                # Express App initialization & Global Middlewares
│   │   └── server.js             # Entrypoint file to launch Backend
│   ├── prisma.config.ts          # Connection driver management for Prisma 7
│   └── package.json
│
├── frontend/                     # --- FRONTEND SUB-PROJECT ---
│   ├── src/
│   │   ├── app/                  # Redux Store config, React Router mapping
│   │   ├── assets/               # Static assets (images, icons)
│   │   ├── features/             # Feature-based folders (auth, user, booking, schedule, chat, admin)
│   │   │   ├── components/       # Feature-specific subcomponents
│   │   │   ├── hooks/            # Custom hooks wrapping TanStack Query
│   │   │   └── services/         # API client handlers for the feature
│   │   ├── pages/                # High-level layouts (Patient, Doctor, Receptionist, Admin)
│   │   ├── shared/               # Shared components and utilities
│   │   │   ├── components/       # General UI elements (buttons, inputs, modals, alerts)
│   │   │   └── services/         # Configured Axios instance with interceptors
│   │   ├── index.html            # Public HTML template
│   │   └── main.jsx              # React mounting file
│   └── package.json
│
├── integration-tests/            # --- INTEGRATION E2E TEST WORKSPACE ---
│   ├── specs/                    # E2E test specs (Mocha + Selenium)
│   ├── helper.js                 # Automation helpers (registration, OTP retriever, session logins)
│   ├── config.js                 # Local connection values & default credentials
│   └── package.json
│
├── docker-compose.yml            # Sets up local MySQL, Redis, and Elasticsearch containers
├── package.json                  # PNPM workspace configurations and commands
└── pnpm-workspace.yaml           # Monorepo packages registry
```

---

## 🛠️ Setup & Local Installation

### Prerequisites
Make sure the following are installed on your local development machine:
1. **Node.js**: LTS version (Version $\ge 20.x$ recommended).
2. **Docker & Docker Compose**: Used to run database and caching services.
3. **pnpm**: Monorepo package manager (`npm install -g pnpm`).

---

### Step-by-Step Installation

#### Step 1: Clone the Project
```bash
git clone <GITHUB_REPOSITORY_URL>
cd CarePlus
```

#### Step 2: Install Monorepo Dependencies
Run the install command from the root directory. PNPM Workspace will resolve all shared libraries:
```bash
pnpm install
```

#### Step 3: Start Infrastructure Services (Docker)
Launch the MySQL database, Redis, and Elasticsearch containers:
```bash
docker-compose up -d
```
*This starts: MySQL (port 3306), Elasticsearch (port 9200), and Redis (port 6379).*

#### Step 4: Configure Backend Environment Variables (`.env`)
Navigate to the backend directory and copy the template:
```bash
cd backend
cp .env.example .env
```
Open `.env` and fill in the connection credentials (see the reference table below).

#### Step 5: Run Database Migrations and Seed Data
Return to the root directory and synchronize the database:
```bash
cd ..

# 1. Apply database migrations to MySQL
pnpm --filter backend exec prisma migrate dev --name init

# 2. Generate Prisma Client
pnpm --filter backend exec prisma generate

# 3. Seed initial mock records into the database
pnpm --filter backend exec node src/scripts/seed.js
```

#### Step 6: Initialize Elasticsearch Indexes (Reindex)
Run the reindexing script to map and move data from MySQL to Elasticsearch:
```bash
pnpm --filter backend exec node src/infrastructure/search/reindex.script.js
```

#### Step 7: Configure Frontend Environment Variables (`.env`)
Navigate to the frontend directory and copy the template:
```bash
cd frontend
cp .env.example .env
```
The default `.env` will target the backend API endpoint:
```env
VITE_API_URL=http://localhost:5000/api/v1
```

#### Step 8: Start Development Servers
Return to the root directory and run the parallel dev command:
```bash
cd ..
pnpm run dev
```
*   **Vite Frontend** runs at: `http://localhost:5173`
*   **Express Backend** runs at: `http://localhost:5000`
*   Verify Backend health by visiting: `http://localhost:5000/health`

---

## 🔒 Environment Variables Reference

### Backend Configuration (`backend/.env`)

| Variable Name | Type | Example Value | Description |
|---|---|---|---|
| `PORT` | Number | `5000` | Port for the Express API backend |
| `DATABASE_URL` | String | `mysql://root:root@localhost:3306/careplus` | MySQL database connection URL |
| `JWT_SECRET` | String | `long_cryptographic_secret_string` | Secret key used to sign Access Tokens |
| `JWT_REFRESH_SECRET` | String | `another_long_secret_string` | Secret key used to sign Refresh Tokens |
| `APP_FRONTEND_URL` | String | `http://localhost:5173` | Frontend URL allowed for CORS connection |
| `MAIL_ENABLED` | Boolean | `false` | Enable/disable sending real SMTP emails (Set to `false` for E2E testing) |
| `MAIL_HOST` | String | `smtp.gmail.com` | SMTP outgoing mail server host |
| `MAIL_PORT` | Number | `587` | SMTP port |
| `MAIL_SECURE` | Boolean | `false` | SSL/TLS connection parameter |
| `MAIL_USER` | String | `example@gmail.com` | System sender email address |
| `MAIL_PASS` | String | `app_password_smtp` | SMTP password (App Password) |
| `MAIL_FROM_NAME` | String | `CarePlus` | Sender display name |
| `MAIL_FROM_ADDRESS`| String | `no-reply@careplus.vn` | Sender display email |
| `CLOUDINARY_CLOUD_NAME`| String | `dq5aguhwe` | Cloud Name for Cloudinary file storage |
| `CLOUDINARY_API_KEY` | String | `476583552456422` | API Key for Cloudinary access |
| `CLOUDINARY_API_SECRET`| String | `api_secret` | API Secret for Cloudinary access |
| `ELASTIC_NODE` | String | `http://localhost:9200` | Connection URL for Elasticsearch |
| `REDIS_URL` | String | `redis://localhost:6379` | Connection URL for Redis cache |

---

## 📜 Development Guidelines & Conventions

All developers must follow the architecture rules defined in [AGENT.md](./AGENT.md).

### 1. Backend Layer Separation
*   **No bypass imports:** Router only calls Controller. Controller only calls Service. Service only calls Repository. Repository only calls Prisma Client.
*   Controllers must **never** reference a Repository or Prisma Client directly.
*   Service methods must remain agnostic of transport protocols (no Express `req` or `res` objects inside services) to simplify unit testing.

### 2. Frontend State Management Rules
*   **Server State (API Data):** Must **never** be copied into the Redux store. Use **TanStack Query** (`useQuery` / `useMutation`) directly for automatic caching, background fetching, and garbage collection.
*   **Client State (Global UI Data):** Store in **Redux Toolkit** (e.g. login credentials, authorization status, active tokens).
*   **Forms:** Managed using `React Hook Form` integrated with `Zod` validation schemas.

### 3. Database & Caching Guidelines
*   **Dynamic Database connection:** Do not hardcode connection properties in `schema.prisma`. Pass connection details dynamically from `prisma.config.ts` using Driver Adapters.
*   All queries must be organized as methods of Domain Repository classes in the `modules/*/*.repository.js` file.

---

## 🧪 Testing Strategy

The project includes an automated end-to-end (E2E) integration test suite built with **Mocha**, **Chai**, and **Selenium Webdriver** running against a Chrome instance.

### Run Integration Tests
1. Make sure both Frontend and Backend development servers are running (`pnpm run dev`).
2. Run tests from the root directory:
```bash
# Run tests in headless mode (Command Line interface only)
pnpm test

# Run tests with active Chrome GUI window for visual debugging
pnpm --filter integration-tests test:ui
```

### Covered Test Flows:
*   **Auth E2E:** Patient registration -> Verify account using Redis-saved OTP -> Log in -> Reset password.
*   **Schedule & Leave E2E:** Register shift as Doctor -> Submit shift exception leave request -> Admin approve/reject leave -> Doctor verifies shift update.
*   **Booking Wizard E2E:** Book appointment for self/relative -> Check-in status -> Block booking after max active limit -> Cancel appointment.
*   **Chat E2E:** Real-time patient-doctor websocket messaging.
*   **Review E2E:** Patients submitting feedback ratings for finished doctor appointments.

---

## 🚀 Production Deployment Guidelines

When deploying CarePlus to staging or production environments:

1. **Frontend Assets Build:**
   - Execute `pnpm --filter frontend build` to compile the React code into optimized, minified static files inside `/dist`.
   - Deploy `/dist` to Nginx, Vercel, Netlify, or AWS S3.
2. **Process Management for Backend:**
   - Run the backend service using a process manager like `PM2` or under a Docker wrapper to ensure auto-restart on crashes.
   - Run the production launch command: `pnpm --filter backend start`.
3. **Secret Management:**
   - Do not commit `.env` files to the code repository.
   - Inject environment variables through system environment contexts or secrets managers.
4. **Email Service Configuration:**
   - Set `MAIL_ENABLED=true` in the production environment and configure valid SMTP server credentials.
