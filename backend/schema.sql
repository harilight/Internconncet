-- =========================================================================
-- InternConnect Complete MySQL Database Schema (Frontend & Analytics Ready)
-- =========================================================================

CREATE DATABASE IF NOT EXISTS internconnect;
USE internconnect;

SET FOREIGN_KEY_CHECKS = 0;

-- Drop tables for clean initialization
DROP TABLE IF EXISTS analytics_events;
DROP TABLE IF EXISTS messages;
DROP TABLE IF EXISTS resources;
DROP TABLE IF EXISTS applications;
DROP TABLE IF EXISTS internships;
DROP TABLE IF EXISTS industry_profiles;
DROP TABLE IF EXISTS college_profiles;
DROP TABLE IF EXISTS student_profiles;
DROP TABLE IF EXISTS users;

-- =========================================================================
-- 1. Core Users Table
-- =========================================================================
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('student', 'college', 'industry') NOT NULL,
    avatar_url VARCHAR(255) DEFAULT 'default-avatar.png',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =========================================================================
-- 2. Student Profiles (Includes Analytics Columns for analytics.html)
-- =========================================================================
CREATE TABLE student_profiles (
    user_id INT PRIMARY KEY,
    college_name VARCHAR(150),
    department VARCHAR(100),
    graduation_year INT,
    skills JSON,
    resume_url VARCHAR(255),
    bio TEXT,
    
    -- Analytics & Skill Matching Score Columns (powers analytics.html)
    profile_views INT DEFAULT 0,
    overall_score INT DEFAULT 75,
    communication_match INT DEFAULT 70,      -- % match for Communication Matrix
    project_mgmt_match INT DEFAULT 55,       -- % match for Project & Architecture
    tech_arch_match INT DEFAULT 45,          -- % match for Technical System Architecture
    algo_match INT DEFAULT 35,               -- % match for Data & Algorithm Verification
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =========================================================================
-- 3. College Profiles (Includes Analytics Columns for college_analytics.html)
-- =========================================================================
CREATE TABLE college_profiles (
    user_id INT PRIMARY KEY,
    institution_name VARCHAR(150) NOT NULL,
    location VARCHAR(100),
    coordinator_name VARCHAR(100),
    contact_phone VARCHAR(20),
    website VARCHAR(255),
    
    -- Analytics & Batch Readiness Columns (powers college_analytics.html)
    verified_registrations_pct INT DEFAULT 88,
    mock_evaluations_pct INT DEFAULT 72,
    skill_badges_pct INT DEFAULT 64,
    core_coding_pct INT DEFAULT 48,
    total_students_placed INT DEFAULT 52,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =========================================================================
-- 4. Industry Profiles (Includes Lookups/Analytics for industry pages)
-- =========================================================================
CREATE TABLE industry_profiles (
    user_id INT PRIMARY KEY,
    company_name VARCHAR(150) NOT NULL,
    industry_type VARCHAR(100),
    company_website VARCHAR(255),
    location VARCHAR(100),
    description TEXT,
    badge_color VARCHAR(20) DEFAULT '#2563eb', -- Avatar brand color
    
    -- Corporate Footprint Analytics Columns
    total_profile_views INT DEFAULT 0,
    active_openings INT DEFAULT 0,
    total_hired INT DEFAULT 0,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =========================================================================
-- 5. Internships Table (Includes Analytics counters)
-- =========================================================================
CREATE TABLE internships (
    id INT AUTO_INCREMENT PRIMARY KEY,
    employer_id INT NOT NULL,
    title VARCHAR(150) NOT NULL,
    company_name VARCHAR(150) NOT NULL,
    location VARCHAR(100) NOT NULL,
    stipend VARCHAR(50) NOT NULL,
    duration VARCHAR(50) NOT NULL,
    work_type ENUM('Remote', 'On-site', 'Hybrid') DEFAULT 'Remote',
    description TEXT NOT NULL,
    requirements TEXT,
    skills_required JSON,
    
    -- Analytics Counters
    views_count INT DEFAULT 0,
    applications_count INT DEFAULT 0,
    
    status ENUM('active', 'closed') DEFAULT 'active',
    posted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (employer_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =========================================================================
-- 6. Applications Table (Complete Workflow Tracking)
-- =========================================================================
CREATE TABLE applications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    internship_id INT NOT NULL,
    status ENUM('applied', 'under_review', 'shortlisted', 'interview', 'offered', 'rejected') DEFAULT 'applied',
    cover_letter TEXT,
    resume_link VARCHAR(255),
    
    -- Timestamps for Analytics Timeline Tracking
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    interview_scheduled_at TIMESTAMP NULL,
    offer_extended_at TIMESTAMP NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    UNIQUE KEY unique_application (student_id, internship_id),
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (internship_id) REFERENCES internships(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =========================================================================
-- 7. Dedicated Analytics Tracking Table (For Progress Graphs & Trends)
-- =========================================================================
CREATE TABLE analytics_events (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NULL,                      -- Who triggered the event
    entity_type ENUM('internship', 'company', 'profile', 'application') NOT NULL,
    entity_id INT NOT NULL,                -- Target ID (e.g. company ID or internship ID)
    event_type ENUM('view', 'apply', 'shortlist', 'interview', 'offer') NOT NULL,
    event_week VARCHAR(20) NOT NULL,       -- e.g. 'Week 1', 'Week 2', 'Current'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =========================================================================
-- 8. Real-Time Chat Table (chat.html)
-- =========================================================================
CREATE TABLE messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sender_id INT NOT NULL,
    receiver_id INT NOT NULL,
    message_text TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =========================================================================
-- 9. Resources Table (resources.html)
-- =========================================================================
CREATE TABLE resources (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    category VARCHAR(100) NOT NULL,
    link VARCHAR(255) NOT NULL,
    uploaded_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

SET FOREIGN_KEY_CHECKS = 1;

-- =========================================================================
-- 10. Sample Data Population (Rich Data for Analytics Charts)
-- =========================================================================

-- Users
INSERT INTO users (id, name, email, password_hash, role) VALUES
(1, 'Rahul Sharma', 'rahul@student.edu', 'hash123', 'student'),
(2, 'Ananya Iyer', 'ananya@student.edu', 'hash123', 'student'),
(3, 'IIT Bombay Placement Cell', 'placements@iitb.ac.in', 'hash123', 'college'),
(4, 'Google LLC HR', 'hr@google.com', 'hash123', 'industry'),
(5, 'Amazon India HR', 'careers@amazon.in', 'hash123', 'industry'),
(6, 'Microsoft India HR', 'recruitment@microsoft.com', 'hash123', 'industry');

-- Student Profiles (Loaded with analytics scores matching frontend)
INSERT INTO student_profiles (user_id, college_name, department, graduation_year, skills, profile_views, overall_score, communication_match, project_mgmt_match, tech_arch_match, algo_match) VALUES
(1, 'IIT Bombay', 'Computer Science', 2026, '["HTML", "CSS", "JavaScript", "Node.js", "MySQL"]', 265, 78, 70, 55, 45, 35),
(2, 'BITS Pilani', 'Information Technology', 2026, '["Python", "Data Science", "SQL", "React"]', 180, 85, 80, 65, 60, 50);

-- College Profiles (Loaded with batch readiness metrics)
INSERT INTO college_profiles (user_id, institution_name, location, coordinator_name, verified_registrations_pct, mock_evaluations_pct, skill_badges_pct, core_coding_pct, total_students_placed) VALUES
(3, 'IIT Bombay', 'Mumbai', 'Prof. Suresh Nair', 88, 72, 64, 48, 52);

-- Industry Profiles (Loaded with Corporate Footprint lookups)
INSERT INTO industry_profiles (user_id, company_name, industry_type, location, badge_color, total_profile_views, active_openings, total_hired) VALUES
(4, 'Google LLC', 'Cloud & Search AI', 'Bangalore', '#ea4335', 14, 5, 18),
(5, 'Amazon India', 'E-Commerce & AWS', 'Hyderabad', '#ff9900', 9, 8, 9),
(6, 'Microsoft India', 'Enterprise Software', 'Bangalore', '#00a4ef', 8, 4, 11);

-- Internships
INSERT INTO internships (id, employer_id, title, company_name, location, stipend, duration, work_type, description, views_count, applications_count) VALUES
(1, 4, 'Full-Stack Node.js Intern', 'Google LLC', 'Bangalore', '₹60,000 / month', '6 Months', 'Hybrid', 'Work on scalable cloud microservices.', 142, 18),
(2, 5, 'Software Development Engineer Intern', 'Amazon India', 'Remote', '₹50,000 / month', '3 Months', 'Remote', 'Build responsive frontend tools.', 98, 12),
(3, 6, 'AI & Systems Engineering Intern', 'Microsoft India', 'Bangalore', '₹55,000 / month', '6 Months', 'On-site', 'Develop enterprise MySQL algorithms.', 115, 15);

-- Applications
INSERT INTO applications (student_id, internship_id, status, cover_letter) VALUES
(1, 1, 'shortlisted', 'Passionate about Node.js and scalable systems.'),
(1, 2, 'interview', 'Excited to contribute to AWS portal tools.'),
(2, 3, 'offered', 'Extensive experience in database algorithms.');

-- Analytics Events (Feeding the Application Progress Tracker timeline chart)
INSERT INTO analytics_events (user_id, entity_type, entity_id, event_type, event_week) VALUES
(1, 'application', 1, 'apply', 'Week 1'),
(1, 'application', 2, 'apply', 'Week 2'),
(1, 'application', 1, 'shortlist', 'Week 3'),
(1, 'application', 2, 'interview', 'Week 4'),
(1, 'application', 1, 'interview', 'Week 5'),
(1, 'application', 2, 'offer', 'Current');

-- Chat Messages
INSERT INTO messages (sender_id, receiver_id, message_text) VALUES
(4, 1, 'Hi Rahul! We reviewed your profile and loved your MySQL skills. Are you free for an interview?'),
(1, 4, 'Hello! Thank you so much. Yes, I am available anytime tomorrow afternoon.');

-- Resources Sample Data
INSERT INTO resources (title, category, link, uploaded_by) VALUES
('Tech Interview Preparation Guide 2026', 'Guideline', 'https://example.com/guide.pdf', 3),
('Standard Resume Template (ATS Friendly)', 'Template', 'https://example.com/resume.docx', 3),
('Full-Stack Web Dev Roadmap & Resources', 'Documentation', 'https://example.com/roadmap.pdf', 3),
('DSA Cheatsheet for Coding Rounds', 'Cheatsheet', 'https://example.com/dsa.pdf', 3);

-- Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    type VARCHAR(50) DEFAULT 'system', -- 'application', 'message', 'interview', 'system'
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    link VARCHAR(255) DEFAULT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

INSERT INTO notifications (user_id, type, title, description, link) VALUES
(1, 'interview', '🎯 Interview Scheduled with Google', 'Google LLC HR scheduled your technical interview for Oct 1 at 2 PM.', 'myapplications.html'),
(1, 'application', '🎉 Application Shortlisted!', 'Microsoft India shortlisted your profile for AI & Systems Engineering Intern.', 'myapplications.html'),
(1, 'message', '💬 New Message from Recruiter', 'Aman Verma sent you feedback on your resume draft.', 'chat.html'),
(1, 'system', '⚡ Profile Score Updated', 'Your profile completeness reached 85%. Add project links to hit 100%.', 'settings.html');

-- =========================================================================
-- 11. Performance Optimization Indexes (High-Speed Lookup Architecture)
-- =========================================================================
CREATE INDEX idx_app_student ON applications(student_id);
CREATE INDEX idx_app_internship ON applications(internship_id, status);
CREATE INDEX idx_msg_participants ON messages(sender_id, receiver_id, sent_at);
CREATE INDEX idx_notif_user_read ON notifications(user_id, is_read);
CREATE INDEX idx_intern_employer_status ON internships(employer_id, status);


