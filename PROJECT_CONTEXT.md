# CivicMind — AI-Enabled Municipal Grievance System
> **Comprehensive Context & Prompt Reference Document for LLMs (GPT-4 / Claude / Gemini / DeepSeek)**

---

## 📌 1. Project Overview

**CivicMind** is a full-stack, AI-enabled municipal grievance reporting and management platform designed to streamline citizen complaint filing, automated deduplication, AI-based issue categorization/severity estimation, auto-assignment to municipal employees, and real-time tracking for citizens and city administrators.

### Core Objectives:
- **Citizen Portal**: File complaints with image uploads, GPS geolocation, automated sector detection, and track resolution status in real-time.
- **Admin (Municipal) Portal**: Manage civic complaints, monitor municipal employee workloads, view auto-grouped duplicate complaints, assign issues, publish official public notices, and review feedback.
- **Field Employee Portal**: View assigned complaints, update progress (In Progress / Resolved), upload proof-of-resolution photos, and report issues/reassignments.
- **AI/ML Core**: Uses NLP models for sector/severity prediction from text descriptions, CNN models (ResNet50) for image issue classification, and image hashing / geospatial clustering for duplicate complaint prevention.

---

## 🛠️ 2. Tech Stack & Infrastructure

| Layer | Technologies Used |
| :--- | :--- |
| **Frontend** | React 19, Vite 7, Tailwind CSS, React Router DOM 7, i18next (Multi-language support) |
| **Backend API** | Node.js, Express.js 5, Mongoose (MongoDB ODM), JWT Auth, Multer, BcryptJS, Sharp, Blockhash |
| **Database** | MongoDB Atlas (Cloud NoSQL) with `2dsphere` spatial indexing for geospatial queries |
| **AI Classification** | Groq Multimodal AI SDK (`openai/gpt-oss-20b` / `qwen/qwen3.6-27b`), 13-Class Canonical Taxonomy |
| **Storage & Media** | Base64 / Local / Cloud image handling with perceptual hashing for duplicate detection |

---

## 📁 3. Directory & File Structure

```
civic_mind/
├── README.md                      # General project overview & setup instructions
├── PROJECT_CONTEXT.md             # This document (Full LLM system reference)
├── test-complaint-api.js          # API integration test script for complaint submission
├── test-credentials.json          # Mock test credentials
│
├── backend/                       # Node.js + Express REST API Server
│   ├── .env                       # Environment configuration (PORT, MONGODB_URI, JWT_SECRET)
│   ├── package.json               # Backend dependencies (express, mongoose, jsonwebtoken, etc.)
│   ├── setup.js / check-admins.js # Admin setup & verification scripts
│   └── src/
│       ├── index.js               # Entry point (Express app listener + MongoDB connection)
│       ├── config/
│       │   └── database.js        # Mongoose database connection with DNS fallback
│       ├── controllers/
│       │   ├── complaintController.js # Core complaint logic (filing, grouping, assignment, status)
│       │   ├── userController.js      # Auth (register, login, profile, employee management)
│       │   ├── noticeController.js    # Public municipal notices CRUD
│       │   ├── messageController.js   # Messaging system between citizens, admins, & workers
│       │   └── feedbackController.js  # Resolution satisfaction feedback logic
│       ├── middleware/
│       │   ├── authMiddleware.js      # JWT verifyToken, checkRole (user, admin, employee)
│       │   └── errorHandler.js        # Global Express exception handler
│       ├── models/
│       │   ├── User.js                # Citizen, Admin, and Employee user schema
│       │   ├── Complaint.js           # Individual complaint schema with 2dsphere location index
│       │   ├── ComplaintGroup.js      # Aggregated group of duplicate/clustered complaints
│       │   ├── Notice.js              # Municipal announcements/notices schema
│       │   └── Message.js             # Chat/communication message schema
│       ├── routes/
│       │   ├── complaintRoutes.js     # /api/complaints routes
│       │   ├── userRoutes.js          # /api/users routes
│       │   ├── noticeRoutes.js        # /api/notices routes
│       │   ├── messageRoutes.js       # /api/messages routes
│       │   └── feedbackRoutes.js      # /api/feedback routes
│       └── services/
│           ├── AadhaarService.js      # Mock citizen identity verification service
│           ├── assignmentService.js   # Smart employee workload-based auto-assignment algorithm
│           ├── deduplicationService.js# Geo-spatial + Image hash complaint deduplication
│           ├── fraudService.js        # Spam & fake complaint detection logic
│           └── geocodingService.js    # Reverse geocoding for lat/long to address conversion
│
├── frontend/                      # React.js + Vite Single Page Application (SPA)
│   ├── package.json               # Frontend dependencies (react, react-router-dom, tailwindcss)
│   ├── vite.config.js             # Vite configuration with proxy rules
│   ├── index.html                 # Main HTML root container
│   └── src/
│       ├── main.jsx               # React DOM entry point
│       ├── App.jsx                # Application root with React Router 7 routes
│       ├── index.css              # Global styles & Tailwind CSS directives
│       ├── pages/
│       │   ├── login.jsx          # Citizen & General Login Page
│       │   ├── register.jsx       # User Registration Page with Aadhaar option
│       │   ├── ForgotPassword.jsx # Password recovery initiation
│       │   ├── ResetPassword.jsx  # Token-based password reset
│       │   ├── employee_dashboard.jsx # Field worker complaint management panel
│       │   ├── admin/
│       │   │   ├── AdminDashboard.jsx        # Admin stats overview & analytics
│       │   │   ├── AdminLogin.jsx            # Municipal Admin login portal
│       │   │   ├── AdminNotices.jsx          # Notice management (Create/Edit/Delete)
│       │   │   ├── AllComplaints.jsx         # View & filter all complaints system-wide
│       │   │   ├── AssignedComplaints.jsx    # Track assigned issues per department
│       │   │   ├── EmployeeManagement.jsx    # Add/Edit field employees & department workloads
│       │   │   ├── FeedbackReview.jsx        # Review citizen feedback on resolved issues
│       │   │   ├── FlaggedComplaints.jsx     # Review complaints flagged for fraud or abuse
│       │   │   └── ReassignmentManagement.jsx# Reassign complaints or manage worker requests
│       │   └── user/
│       │       ├── UserDashboard.jsx # Citizen overview portal & quick stats
│       │       ├── FileComplaint.jsx # Interactive complaint submission form (Image/Cam/GPS)
│       │       ├── MyComplaints.jsx  # List & status timeline of user's filed complaints
│       │       ├── ComplaintDetail.jsx# Detailed view of a single complaint
│       │       ├── UserNotices.jsx   # Municipal notices board for citizens
│       │       └── UserProfile.jsx   # Citizen account profile & settings
│
└── ml_backend/                    # Historical ML notebook research & datasets
    ├── README.md                  # Decommissioning & Groq migration notice
    └── ML_models/                 # Jupyter notebook training references & historical CSV datasets
```

---

## 🗄️ 4. Data Schemas (MongoDB / Mongoose)

### 4.1 `User` Schema ([`User.js`](file:///c:/Users/Dr.%20Sawant/OneDrive/Documents/Desktop/civic-mind/civic_mind/backend/src/models/User.js))
- **`name`**, **`email`**, **`password`** (hashed with bcrypt)
- **`role`**: Enum `['user', 'admin', 'employee']` (Default: `'user'`)
- **`phone`**, **`municipalityCode`** (e.g. `'BMC'`)
- **`aadhaar_verified`**, **`email_verified`**, **`phone_verified`** (Booleans)
- **Employee Specific Fields**:
  - **`employeeId`**: Unique String ID
  - **`department`**: Enum `['Water', 'Roads', 'Waste', 'Electricity', 'Health', 'General', 'Drainage']`
  - **`designation`**: Job title / role
  - **`maxConcurrentComplaints`**: Default `5`
  - **`currentWorkload`**: Number of active assigned complaints
  - **`availabilityStatus`**: Enum `['AVAILABLE', 'BUSY', 'OFF_DUTY', 'ON_LEAVE', 'UNAVAILABLE']`
  - **`performance`**: `{ avgResolutionTime, successRate, totalComplaintsHandled }`

### 4.2 `Complaint` Schema ([`Complaint.js`](file:///c:/Users/Dr.%20Sawant/OneDrive/Documents/Desktop/civic-mind/civic_mind/backend/src/models/Complaint.js))
- **`complaint_id`**: Human-readable unique string (e.g., `CMP_1740000000000_1234`)
- **`description`**: Text description of the issue
- **`image`**: Base64 data string or URL of image evidence
- **`location`**: GeoJSON Point `{ type: 'Point', coordinates: [longitude, latitude] }` with `2dsphere` index
- **`address`**: `{ fullAddress, area, locality, city, state, pincode, landmark }`
- **`sector`**: Department string (`'Roads'`, `'Water'`, `'Waste'`, etc.)
- **`status`**: `'Pending'`, `'Assigned'`, `'In Progress'`, `'Resolved'`, `'Closed'`
- **`priority`**: `'Low'`, `'Medium'`, `'High'`, `'Critical'`
- **`user_id`**: Reference to `User` (Citizen)
- **`assigned_to`**: Reference to `User` (Employee)
- **`group_id`**: Reference to `ComplaintGroup` (if deduplicated/clustered)
- **`imageHash`**: Perceptual hash of complaint photo for image similarity checks
- **`fraudScore`**: Numerical risk score calculated by fraud detection service
- **`flagged`**, **`flagReason`**: For review of suspicious submissions

### 4.3 `ComplaintGroup` Schema ([`ComplaintGroup.js`](file:///c:/Users/Dr.%20Sawant/OneDrive/Documents/Desktop/civic-mind/civic_mind/backend/src/models/ComplaintGroup.js))
- Aggregates multiple individual citizen complaints filed within close geographical proximity (e.g. 50m radius) for the same civic problem into a single master work ticket.
- **`group_id`**, **`issue_title`**, **`issue_description`**
- **`centroid_location`**: GeoJSON Point (Centroid of all merged complaints)
- **`complaints`**: Array of `Complaint` ObjectIds
- **`affected_users`**: Array of citizen `User` ObjectIds
- **`complaint_count`**: Counter of merged complaints (helps prioritize popular issues)
- **`assigned_to`**: Assigned field worker

---

## 📡 5. Backend REST API Reference

All backend routes are prefixed with `/api`. Authentication headers require standard `Authorization: Bearer <JWT_TOKEN>`.

### 🔑 Authentication Routes (`/api/users`)
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/users/register` | Register new citizen account | ❌ No |
| `POST` | `/api/users/login` | Login user, admin, or employee & return JWT | ❌ No |
| `GET` | `/api/users/profile` | Get logged-in user profile details | ✅ Yes |
| `POST` | `/api/users/forgot-password` | Initiate token-based password reset | ❌ No |
| `POST` | `/api/users/reset-password` | Reset password using reset token | ❌ No |
| `GET` | `/api/users/employees` | List field employees (Filterable by department/status) | ✅ Admin |
| `POST` | `/api/users/employees` | Create/Add new field employee account | ✅ Admin |

### 📝 Complaint Routes (`/api/complaints`)
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/complaints` | File new complaint (Runs reverse geocoding, NLP/CNN, deduplication) | ✅ Yes |
| `GET` | `/api/complaints` | Fetch user's own complaints or all complaints (Admin/Worker) | ✅ Yes |
| `GET` | `/api/complaints/:id` | Get details of a specific complaint | ✅ Yes |
| `PATCH` | `/api/complaints/:id/status` | Update complaint status (e.g. In Progress, Resolved) | ✅ Worker/Admin |
| `POST` | `/api/complaints/:id/assign` | Assign complaint to a field employee | ✅ Admin |
| `GET` | `/api/complaints/groups` | Fetch aggregated complaint groups | ✅ Admin |

### 📢 Notice Routes (`/api/notices`)
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/notices` | Get all public municipal notices | ❌ Public |
| `POST` | `/api/notices` | Create official notice | ✅ Admin |
| `PUT` | `/api/notices/:id` | Update existing notice | ✅ Admin |
| `DELETE`| `/api/notices/:id` | Delete notice | ✅ Admin |

---

## ⚡ 6. Key Workflows & Algorithms

### 📍 1. Complaint Filing & Deduplication Algorithm
1. **Input**: Citizen submits image (Base64), description, and GPS coordinates `(lat, long)`.
2. **Reverse Geocoding**: Converts `(lat, long)` to structured address (area, locality, city, pincode) via [`geocodingService.js`](file:///c:/Users/Dr.%20Sawant/OneDrive/Documents/Desktop/civic-mind/civic_mind/backend/src/services/geocodingService.js).
3. **AI Classification**:
   - Sends description to ML backend for **Sector Detection** (e.g., Road, Water) and **Severity Prediction** (Low, Medium, High).
   - Image hash (blockhash) is generated to identify visually identical photos.
4. **Geo-Spatial Clustering**:
   - Queries MongoDB using `$near` / `$geoWithin` for existing complaints within **50 meters** having the same sector.
   - If a match is found: Merges complaint into existing `ComplaintGroup` and increments `complaint_count`.
   - If no match: Creates a new `Complaint` and initial `ComplaintGroup`.

### 👷 2. Smart Auto-Assignment
- Evaluates available field employees in the matching `department` (e.g., Water Department).
- Checks worker availability (`availabilityStatus == 'AVAILABLE'`) and `currentWorkload < maxConcurrentComplaints`.
- Automatically selects the worker with lowest active workload and updates `assigned_to`.

---

## 🚀 7. How to Run the Project Locally

### Prerequisites
- Node.js (v18+)
- MongoDB Atlas account (configured in `backend/.env`)

### 1. Start Backend API (Port 5000)
```bash
cd backend
npm install
npm run dev
```

### 2. Start Frontend UI (Port 3000)
```bash
cd frontend
npm install
npm run dev
```

### 3. Start ML Backend (Optional Python FastAPI, Port 8000)
```bash
cd ml_backend
pip install -r requirements.txt
python app.py
```

---

## 🤖 8. Guidelines for LLM Assistants

When asked to add features, fix bugs, or optimize this codebase:
1. **Preserve Database Models**: Maintain Mongoose schema compatibility in [`User.js`](file:///c:/Users/Dr.%20Sawant/OneDrive/Documents/Desktop/civic-mind/civic_mind/backend/src/models/User.js), [`Complaint.js`](file:///c:/Users/Dr.%20Sawant/OneDrive/Documents/Desktop/civic-mind/civic_mind/backend/src/models/Complaint.js), and [`ComplaintGroup.js`](file:///c:/Users/Dr.%20Sawant/OneDrive/Documents/Desktop/civic-mind/civic_mind/backend/src/models/ComplaintGroup.js).
2. **GeoJSON Format**: Ensure location field always uses `coordinates: [longitude, latitude]` format (longitude first for MongoDB GeoJSON).
3. **Error Handling**: Use Express `errorHandler` middleware and pass errors using `next(error)`.
4. **React Component Conventions**: Keep styling in Tailwind CSS dark/glassmorphic theme consistent with existing components in [`frontend/src/pages`](file:///c:/Users/Dr.%20Sawant/OneDrive/Documents/Desktop/civic-mind/civic_mind/frontend/src/pages).
