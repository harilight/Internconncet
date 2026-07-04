# 🚀 InternConnect — Next-Gen Internship & Career Networking Ecosystem

![Platform Status](https://img.shields.io/badge/Status-Active%20%26%20Production%20Ready-brightgreen)
![Tech Stack](https://img.shields.io/badge/Stack-Node.js%20%7C%20Express%20%7C%20MySQL%20%7C%20Socket.IO-blue)
![License](https://img.shields.io/badge/License-MIT-purple)

**InternConnect** is a state-of-the-art, full-stack career networking and recruitment platform designed to seamlessly bridge the gap between **Students**, **Industry Recruiters**, and **College Placement Cells**. Built with a focus on premium aesthetics, real-time communication, and role-based workflows, InternConnect transforms how campus recruitment and internships are managed.

---

## ✨ Key Highlights & Features

### 🎓 1. Student Portal
* **Live Internship Discovery:** Explore dynamic internship opportunities with rich company cards, stipend details, and domain tagging.
* **One-Click Application Pipeline:** Apply to roles instantly and track application milestones in real-time (*Applied ➔ Shortlisted ➔ Interview Scheduled ➔ Offered*).
* **Interactive Dashboard & Analytics:** View personal application success rates, profile completeness, and upcoming interview schedules.
* **Direct Recruiter Chat:** Communicate directly with hiring managers and university placement officers.

### 🏢 2. Industry Recruiter Portal
* **Talent Scouting & Management:** Review student applications, filter candidates by skills and academic standing, and update applicant statuses with a single click.
* **Internship Publishing Hub:** Post new internship openings, set stipend ranges, define eligibility criteria, and manage active listings.
* **Role-Based Privacy Filtering:** Recruiters only see relevant student candidates and college placement coordinators—competitor companies are automatically filtered out for complete privacy.
* **Live Candidate Communication:** Conduct technical and HR round discussions via an interactive real-time chat interface.

### 🏫 3. College Placement Cell Portal
* **Campus Drive Orchestration:** Coordinate institutional placement drives, partner with verified industry employers, and track campus-wide selection metrics.
* **Student Roster & Verification:** Monitor student engagement and verify academic records for partner organizations.
* **Institutional Broadcasts:** Send announcements and critical notifications directly to students and recruiters.

### 💬 4. Real-Time Communication & Notifications (Socket.IO)
* **Instant Messaging:** Live bidirectional messaging powered by WebSockets with database persistence.
* **Dynamic Pop-In Badges:** Unread notification counters and visual badges pop in instantly when new messages or updates arrive, and vanish automatically upon viewing or clicking **Clear All**.
* **Unified Notification Center:** Dedicated notification pages for all three user roles with real-time MySQL synchronization.

---

## 🛠️ Technology Stack

* **Frontend:** Pure HTML5, Modern CSS3 (Glassmorphism, Flexbox/Grid layouts, custom responsive design tokens), Vanilla JavaScript (ES6+ Modules & Async/Await).
* **Backend:** Node.js & Express.js REST API Architecture.
* **Real-Time Engine:** Socket.IO for live WebSocket messaging and event broadcasting.
* **Database:** MySQL relational database with comprehensive foreign-key indexing and relational integrity.

---

## 📂 Architecture & Directory Structure

```text
internconnect/
├── index.html                  # Main Landing Page
├── auth.html                   # Unified Authentication & Login Portal
├── explore.html                # Public & Student Internship Discovery
├── dashboard.html              # Student Dashboard
├── chat.html                   # Student Real-Time Messaging Hub
├── notifications.html          # Student Notification Center
├── myapplications.html         # Student Application Tracking
├── settings.html               # Student Profile & Account Settings
├── resources.html              # Career Guidance & Interview Resources
├── industry/                   # 🏢 Industry Recruiter Portal
│   ├── industry_dashboard.html # Employer Analytics & Overview
│   ├── industry_chat.html      # Employer Messaging Hub
│   ├── manage_internships.html # Internship Listing Management
│   ├── post_internship.html    # Job Posting Creation Form
│   └── notifications.html      # Employer Notification Center
├── college/                    # 🏫 College Placement Cell Portal
│   ├── college_dashboard.html  # Institutional Drive Overview
│   ├── college_chat.html       # Placement Cell Messaging Hub
│   └── notifications.html      # Institutional Notification Center
└── backend/                    # ⚙️ Node.js + Express + MySQL Backend
    ├── server.js               # Main Express Server & Socket.IO Initialization
    ├── db.js                   # MySQL Connection Pool & Query Handler
    ├── schema.sql              # Complete MySQL Database Schema & Seed Data
    └── routes/                 # API Endpoints (Auth, Internships, Chat, Notifications)
```

---

## 🚀 Getting Started & Setup Guide

Follow these simple steps to get InternConnect up and running on your local machine.

### 1️⃣ Prerequisites
* **Node.js** (v16+ recommended)
* **MySQL Server** (v8.0+ recommended)

### 2️⃣ Database Setup
1. Open your MySQL client (e.g., MySQL Workbench, XAMPP, or Terminal).
2. Create and initialize the database using the provided schema:
   ```sql
   SOURCE backend/schema.sql;
   ```
   *(This will automatically create the `internconnect` database, all required tables, and insert default test accounts).*

### 3️⃣ Backend Environment Configuration
1. Navigate to the `backend/` folder:
   ```bash
   cd backend
   ```
2. Create a `.env` file (if not already present) with your MySQL credentials:
   ```env
   PORT=5000
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=your_mysql_password
   DB_NAME=internconnect
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Start the backend server:
   ```bash
   node server.js
   ```
   *You should see:* `🚀 Server running on port 5000` *and* `✅ Connected to MySQL Database`.

### 4️⃣ Launching the Frontend
1. Simply open `index.html` in your modern web browser, OR serve the project folder using a local web server (like VS Code **Live Server** extension).
2. Navigate to **Login** (`auth.html`) and start exploring!

---

## 🔑 Default Test Accounts (Pre-Seeded)

When you import `schema.sql`, the following test accounts are automatically created for quick testing:

| Role | Email | Password | Name |
| :--- | :--- | :--- | :--- |
| **🎓 Student** | `rahul@example.com` | `password123` | Rahul Sharma (IIT Bombay) |
| **🎓 Student** | `ananya@example.com` | `password123` | Ananya Iyer (BITS Pilani) |
| **🏫 College** | `placement@iitb.ac.in` | `password123` | IIT Bombay Placement Cell |
| **🏢 Industry** | `hr@google.com` | `password123` | Google LLC HR |
| **🏢 Industry** | `recruiter@nvidia.com` | `password123` | NVIDIA Recruiter |

---

## 🤝 Contributing
Contributions, issues, and feature requests are welcome! Feel free to fork this repository and submit pull requests to enhance the ecosystem.

## 📄 License
This project is licensed under the MIT License.
