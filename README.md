# RC Foundation — Blood Management System v2.0

## Quick Start

### Prerequisites
- Java 17+, Maven 3.8+
- Node.js 18+, npm 9+
- PostgreSQL 14+ (or Supabase free tier)

---

## Backend Setup

### 1. Configure environment variables

Create a `.env` file or set these directly (or edit `application.properties`):

```env
# Required
DB_URL=jdbc:postgresql://localhost:5432/bms
DB_USERNAME=postgres
DB_PASSWORD=your_password
JWT_SECRET=your_64_char_secret_minimum_32_chars_required

# CORS — set to your frontend URL in production
CORS_ORIGINS=http://localhost:3000

# Optional — FCM push notifications
FIREBASE_CREDENTIALS_PATH=/path/to/firebase-service-account.json
FIREBASE_PROJECT_ID=your-firebase-project-id

# Optional — Google Maps (for future map embed)
GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```

### 2. Create the database

```sql
CREATE DATABASE bms;
```

> Spring Boot will auto-create all tables on first run via `spring.jpa.hibernate.ddl-auto=update`

### 3. Create the Admin user (run once after first boot)

```sql
-- Insert admin user (password: Admin@123 — bcrypt hash below)
INSERT INTO users (name, phone, password, role, active, available, created_at, updated_at)
VALUES (
  'System Admin',
  '0000000000',
  '$2a$12$9P2PNPQXLCf.IJj0Vv7e8ucJfzWAzjAITSwlnzf/VumJy0EEA5Rgy',
  'ADMIN',
  true,
  true,
  NOW(),
  NOW()
);
```

Default credentials: Phone `9999999999`, Password `Admin@123`
**Change the password immediately after first login.**

### 4. Run the backend

```bash
cd backend
mvn spring-boot:run
```

Backend starts on `http://localhost:8080`

---

## Frontend Setup

### 1. Install dependencies

```bash
cd frontend
npm install
```

### 2. Create `.env` file

```env
REACT_APP_API_URL=/api

# Optional Firebase (for push notifications)
REACT_APP_FIREBASE_API_KEY=
REACT_APP_FIREBASE_AUTH_DOMAIN=
REACT_APP_FIREBASE_PROJECT_ID=
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=
REACT_APP_FIREBASE_APP_ID=
REACT_APP_FIREBASE_VAPID_KEY=
```

### 3. Run the frontend

```bash
npm start
```

Frontend starts on `http://localhost:3000`

---

## Production Deployment

### Backend (Spring Boot JAR)

```bash
cd backend
mvn package -DskipTests
java -jar target/blood-management-system-2.0.0.jar \
  --DB_URL=jdbc:postgresql://... \
  --DB_USERNAME=... \
  --DB_PASSWORD=... \
  --JWT_SECRET=... \
  --CORS_ORIGINS=https://your-domain.com
```

### Frontend (React Build)

```bash
cd frontend
npm run build
# Deploy /build folder to Netlify, Vercel, or serve via Nginx
```

### Nginx reverse proxy (recommended)

```nginx
server {
  listen 80;
  server_name yourdomain.com;

  location /api/ {
    proxy_pass http://localhost:8080/api/;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
  }

  location / {
    root /var/www/bms/build;
    try_files $uri /index.html;
  }
}
```

---

## API Keys You Need

| Service | Purpose | Where to get |
|---|---|---|
| Firebase project | Push notifications | [console.firebase.google.com](https://console.firebase.google.com) — free |
| Firebase VAPID key | Web push | Firebase > Project Settings > Cloud Messaging |
| Google Maps API | Map display (future) | [console.cloud.google.com](https://console.cloud.google.com) |
| PostgreSQL / Supabase | Database | [supabase.com](https://supabase.com) — free tier works |

---

## User Roles

| Role | Access |
|---|---|
| `ADMIN` | Full system control, user management, all analytics |
| `HOSPITAL` | Search blood, raise requests, track delivery, view history |
| `BLOOD_BANK` | Manage inventory, donors, camps, accept/reject requests |
| `RIDER` | View assigned tasks, update delivery status, OTP confirmation |

---

## Key API Endpoints

```
POST /api/auth/register       — Register new user
POST /api/auth/login          — Login, returns JWT + refresh token
POST /api/auth/refresh        — Refresh access token
POST /api/auth/logout         — Logout (revokes refresh token)

GET  /api/inventory/search    — Search blood by group + qty (hospital)
POST /api/inventory           — Add blood units (blood bank)
GET  /api/inventory/my        — Get own inventory (blood bank)

POST /api/requests            — Raise blood request (hospital)
GET  /api/requests/my         — Active requests (hospital)
GET  /api/requests/my/history — Request history (hospital)
GET  /api/requests/blood-bank — Active requests for blood bank
GET  /api/requests/blood-bank/history
PUT  /api/requests/{id}/status          — Accept/Reject (blood bank)
PUT  /api/requests/{id}/assign-rider    — Assign rider (blood bank)
GET  /api/requests/rider/tasks          — Active tasks (rider)
PUT  /api/requests/{id}/rider-status    — Update status + OTP (rider)

GET  /api/notifications                 — Get notifications
GET  /api/notifications/unread-count    — Unread count
PUT  /api/notifications/mark-all-read

GET  /api/admin/reports/summary         — Platform analytics (admin)
GET  /api/admin/users                   — All users (admin)
POST /api/admin/users                   — Create user (admin)
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, React Router, Tailwind CSS |
| Backend | Java 17, Spring Boot 3.2, Spring Security, JPA |
| Database | PostgreSQL (via Supabase or self-hosted) |
| Auth | JWT (access 15min) + Refresh token (7 days) |
| Push | Firebase Cloud Messaging (optional) |
| Deploy | Any Linux VPS, Railway, Render, or AWS |

---

## Security Notes

- JWT access tokens expire in **15 minutes**; refresh tokens in **7 days**
- Account locked after **5 failed login attempts** for 15 minutes
- All passwords hashed with **BCrypt** (strength 12)
- CORS restricted to configured origins only
- Admin user can only be created via direct DB insert (no API endpoint)
