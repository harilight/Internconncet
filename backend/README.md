# InternConnect Backend Server (Node.js + MySQL + Socket.io)

## 📌 Prerequisites
1. **Node.js** (v18+ recommended)
2. **MySQL Server** (via XAMPP, WAMP, or standalone MySQL)

---

## ⚡ Step 1: Setup Database
Run the schema file inside MySQL CMD or MySQL Workbench:
```sql
source c:/Users/harih/Documents/internconnect/backend/schema.sql;
```

---

## 🚀 Step 2: Install Dependencies & Start Server
Open terminal in the `backend` directory and run:
```powershell
cd backend
npm install
npm run dev
```

The server will start on `http://localhost:5000`.

---

## 🔌 API Endpoints Summary

### Authentication
* `POST /api/auth/login` (Body: `{ email, password }`)
* `POST /api/auth/register` (Body: `{ name, email, password, role }`)

### Analytics (Powers scorecards & charts)
* `GET /api/analytics/student/:userId`
* `GET /api/analytics/college/:userId`

### Internships
* `GET /api/internships?search=...&location=...`
* `GET /api/internships/:id`
* `POST /api/internships` (Employer posting)

### Applications
* `GET /api/applications/student/:studentId`
* `POST /api/applications`

### Real-Time Chat
* `GET /api/chat/:userId/:contactId`
* Socket.io WebSocket connection on `ws://localhost:5000`
