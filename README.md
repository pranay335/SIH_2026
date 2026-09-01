<div align="center">

# 🏙️ CivicMind
### AI-Enabled Municipal Grievance Management System

*Empowering citizens. Streamlining governance. Powered by AI.*

![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Groq](https://img.shields.io/badge/Groq-Multimodal_LLM-F55036?style=for-the-badge&logo=lightning&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-8.0-47A248?style=for-the-badge&logo=mongodb&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)
![PWA](https://img.shields.io/badge/PWA-Installable-5A0FC8?style=for-the-badge&logo=pwa&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)

</div>

---

## 📖 About the Project

**CivicMind** is a full-stack, AI-powered civic grievance management platform designed to bridge the gap between citizens and municipal authorities.

Citizens file complaints with a description, photo, and GPS-detected location. A **Groq multimodal LLM** reads the description and photo together and classifies the complaint into one of 13 defect categories with a severity level and confidence score — eliminating manual categorization. The backend then auto-geocodes the location, checks for duplicate/nearby reports, flags likely fraud, and auto-assigns the complaint to an available field employee. Citizens track every step through their personal dashboard.

The system is built around **three dedicated portals** — Citizen, Admin, and Employee — with a clean, light UI, and ships as an **installable Progressive Web App (PWA)**.

> 🎯 Aligned with **SDG 11** (Sustainable Cities) and **SDG 16** (Peace, Justice & Strong Institutions).

---

## 🏗️ System Architecture

CivicMind is a **two-tier architecture**: a React PWA frontend and an Express REST API backend. Complaint classification runs *inside* the backend via Groq's multimodal API — there is no separate ML microservice.

```
┌───────────────────────────────────────┐
│      React Frontend (Vite, PWA)       │  https://localhost:3000
│    Citizen | Admin | Employee UI      │
└──────────────────┬─────────────────────┘
                    │  REST API calls
                    ▼
┌─────────────────────────────────────────────────┐
│         Node.js / Express.js Backend             │  http://localhost:5000
│  Auth · Complaints · Notices · Feedback ·        │
│  Employees · Messages · Geocoding · Deduplication │
└──────┬─────────────────────────┬──────────────────┘
       │  Mongoose ODM            │  Multimodal classification
       ▼                          ▼
┌─────────────┐          ┌─────────────────────────┐
│   MongoDB   │          │   Groq API (LLM)         │
│  (Atlas or  │          │  Vision-language model    │
│   Local)    │          │  → 13-class defect        │
└─────────────┘          │    taxonomy + severity    │
                          └─────────────────────────┘
```

### Port Reference

| Service | Technology | Default Port |
|---|---|---|
| Frontend | React + Vite (PWA) | `3000` (falls back to next free port if busy) |
| Backend API | Node.js + Express | `5000` |
| Database | MongoDB | `27017` |

---

## ✨ Features

### 👤 Citizen Portal
- 📝 Register and login with secure JWT authentication
- 📸 File complaints with text description, photo upload / live camera capture
- 📍 Auto GPS location detection with reverse geocoding on complaint submission
- 🤖 AI auto-categorizes issue sector and severity instantly via Groq's multimodal LLM
- 📊 Real-time dashboard — track complaint status (Pending → Assigned → In Progress → Resolved)
- 📢 View official municipal notices and announcements
- ⭐ Submit feedback and ratings on resolved complaints
- 🔑 Forgot password / reset password via email
- 📲 Installable as a native-feeling app (PWA) — no app store required

### 🛡️ Admin (Municipal) Portal
- 🔐 Separate, secure admin login
- 📈 Dashboard with live complaint statistics
- 📋 View and filter all complaints, assigned complaints, and flagged complaints
- 👷 Assign complaints to employees with capacity-aware allocation
- 🔄 Reassignment management for overloaded or unavailable employees
- 👥 Employee management — add, view, and manage field staff
- 📝 Post and manage official municipal notices
- 💬 Review and analyze citizen feedback

### 👷 Employee Portal
- 📋 Dedicated dashboard showing all assigned complaints
- 🖼️ View complaint details with photos and location
- ✅ Update complaint resolution status
- 📊 Dynamic capacity tracking (real-time remaining slots)

### 🤖 AI Classification Engine (Groq Multimodal LLM)
- Single vision-language model call classifies **description + photo together** — no separate NLP/CNN models to train, host, or version
- **13-class defect taxonomy** (potholes, footpath damage, road signs, garbage dumping, dead animals/bio-hazard, drainage clogs, damaged poles, dangling wires, water pipeline leaks, damaged bridges, fallen trees, graffiti/vandalism, illegal parking) — each mapped to the responsible municipal department and a suggested operational action
- Confidence-tiered routing: high-confidence results auto-assign; low-confidence results are flagged for manual review
- Built-in duplicate detection (geo-clustering nearby complaints into groups) and basic fraud scoring
- Structured JSON output validated against the taxonomy before it ever reaches the database

---

## 🛠️ Tech Stack

### Frontend
| Technology | Version | Purpose |
|---|---|---|
| React | 19 | UI framework |
| Vite | 7 | Build tool & dev server |
| vite-plugin-pwa | — | Service worker + installable manifest |
| Tailwind CSS | 3.4 | Utility-first styling |
| React Router | v7 | Client-side routing |
| React i18next | 16 | Internationalization |
| Context API | — | Global auth state management |

### Backend
| Technology | Version | Purpose |
|---|---|---|
| Node.js | 18+ | JavaScript runtime |
| Express | 5 | REST API framework |
| MongoDB | — | NoSQL database |
| Mongoose | 8 | ODM / schema management |
| **Groq SDK** | 1.6 | Multimodal LLM complaint classification |
| JSON Web Token | 9 | Authentication tokens |
| bcryptjs | 3 | Password hashing |
| Multer | 2 | Image / file upload handling |
| Nodemailer | 8 | Password reset emails |
| Sharp | 0.34 | Server-side image processing |
| blockhash-core / jpeg-js / pngjs | — | Perceptual image hashing for duplicate detection |
| Jest | 29 | Test suite |

---

## 📁 Project Structure

```
civic_mind/
│
├── frontend/                        # React + Vite Single Page Application (PWA)
│   ├── index.html
│   ├── vite.config.js               # Dev server, HTTPS, PWA manifest/service worker config
│   ├── tailwind.config.js
│   ├── scripts/generate-icons.mjs   # Generates PWA app icons from a branded SVG
│   ├── public/                      # PWA icons, manifest assets
│   └── src/
│       ├── App.jsx                  # Root router with protected routes
│       ├── main.jsx                 # React entry point
│       ├── index.css                # Global styles
│       ├── context/
│       │   └── AuthContext.jsx      # Auth state (JWT, user role)
│       ├── layouts/
│       │   ├── UserLayout.jsx       # Citizen portal layout
│       │   └── AdminLayout.jsx      # Admin portal layout
│       ├── components/              # Reusable UI components
│       │   ├── Navbar.jsx
│       │   ├── Hero.jsx
│       │   ├── Features.jsx
│       │   ├── ProtectedRoute.jsx
│       │   └── ...
│       ├── pages/
│       │   ├── login.jsx            # Citizen login
│       │   ├── register.jsx         # Citizen registration
│       │   ├── ForgotPassword.jsx
│       │   ├── ResetPassword.jsx
│       │   ├── user/                # 🧑 Citizen portal pages
│       │   │   ├── UserDashboard.jsx
│       │   │   ├── FileComplaint.jsx
│       │   │   ├── MyComplaints.jsx
│       │   │   ├── UserNotices.jsx
│       │   │   └── UserProfile.jsx
│       │   ├── admin/               # 🛡️ Admin portal pages
│       │   │   ├── AdminLogin.jsx
│       │   │   ├── AdminDashboard.jsx
│       │   │   ├── AllComplaints.jsx
│       │   │   ├── AssignedComplaints.jsx
│       │   │   ├── FlaggedComplaints.jsx
│       │   │   ├── Employees.jsx
│       │   │   ├── EmployeeManagement.jsx
│       │   │   ├── AdminNotices.jsx
│       │   │   ├── FeedbackReview.jsx
│       │   │   └── ReassignmentManagement.jsx
│       │   └── employee_dashboard.jsx  # 👷 Employee portal
│       └── services/                # Axios/fetch API call wrappers
│
└── backend/                          # Node.js + Express REST API
    ├── package.json
    ├── .env.example
    ├── tests/                       # Jest test suite (Groq service, taxonomy, routing, etc.)
    └── src/
        ├── index.js                 # App entry — mounts all routes
        ├── config/
        │   ├── database.js          # MongoDB connection
        │   ├── taxonomy.js          # 13-class defect taxonomy (single source of truth)
        │   ├── groqPrompt.js        # Prompt template for the Groq vision model
        │   └── routingResolver.js   # Confidence-tiered assignment routing
        ├── models/                  # Mongoose schemas
        │   ├── User.js
        │   ├── Complaint.js
        │   ├── ComplaintGroup.js
        │   ├── Notice.js
        │   └── Message.js
        ├── controllers/             # Business logic handlers
        │   ├── userController.js
        │   ├── complaintController.js  # Orchestrates geocoding → Groq classification → assignment
        │   ├── noticeController.js
        │   ├── feedbackController.js
        │   └── messageController.js
        ├── routes/                  # Express route definitions
        ├── middleware/
        │   ├── auth.js              # JWT verification
        │   ├── adminAuth.js         # Admin-only guard
        │   └── errorHandler.js
        ├── services/
        │   └── groqService.js       # Groq multimodal API client
        └── utils/
            └── groqValidator.js     # Validates/sanitizes Groq's structured output
```

---

## ✅ Prerequisites

| Tool | Version | Download |
|---|---|---|
| Node.js | v18 or above | https://nodejs.org |
| MongoDB | Local or Atlas | https://mongodb.com |
| Git | Latest | https://git-scm.com |
| Groq API key | free tier available | https://console.groq.com |

Verify your setup:
```bash
node -v
npm -v
git --version
```

---

## ⚙️ Environment Variables

Create a `.env` file inside the `backend/` folder. Use `.env.example` as a template:

```bash
cp backend/.env.example backend/.env
```

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/complaints_db
NODE_ENV=development
JWT_SECRET=your_strong_secret_key_here

GROQ_API_KEY=your_groq_api_key_here
GROQ_MODEL=openai/gpt-oss-20b
```

> **MongoDB Atlas**: Replace `MONGODB_URI` with your Atlas connection string:
> `mongodb+srv://<username>:<password>@cluster.mongodb.net/complaints_db`

> **Never commit `backend/.env`** — it's already git-ignored. Rotate any credential immediately if it's ever accidentally committed or shared.

---

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/pranay335/SIH_2026.git
cd SIH_2026
```

---

### 2. Backend Setup

```bash
cd backend
npm install
```

Configure your environment variables (see above), then start the server:

```bash
npm run dev
```

✅ Backend running at `http://localhost:5000`

---

### 3. Frontend Setup

Open a new terminal:

```bash
cd frontend
npm install
npm run dev
```

✅ Frontend running at `http://localhost:3000` (or the next free port, e.g. `3001`, if 3000 is busy)

By default Vite serves plain HTTP. To test the installable PWA on a phone over your local network, see **LAN & HTTPS Setup** below.

---

### 4. Run Both Together

Open two terminals:

| Terminal | Command |
|---|---|
| Terminal 1 | `cd backend && npm run dev` |
| Terminal 2 | `cd frontend && npm run dev` |

Then open your browser at **http://localhost:3000**

---

## 📲 Progressive Web App (PWA)

The frontend is installable — visiting the site offers an "Install app" prompt that adds CivicMind to the home screen / app list with no browser chrome, using a cached app shell for offline resilience.

- Manifest and service worker are configured via `vite-plugin-pwa` in `frontend/vite.config.js`
- Icons are generated from a single branded SVG via `frontend/scripts/generate-icons.mjs` (`node frontend/scripts/generate-icons.mjs`) — regenerate after changing the brand mark
- API calls (`/api/...`) always hit the network; static assets are cached for offline use

### LAN & HTTPS Setup

Browsers only allow installing a PWA over a **secure context** — `localhost` counts automatically, but a plain `http://<lan-ip>` does not. To test on a phone over Wi-Fi:

1. Generate a local CA + certificate for your machine's LAN IP (OpenSSL, no extra tools needed):
   ```bash
   cd frontend
   mkdir certs && cd certs
   openssl genrsa -out ca-key.pem 2048
   openssl req -x509 -new -nodes -key ca-key.pem -sha256 -days 3650 -out ca-cert.pem -subj "/CN=CivicMind Local Dev CA"
   # create server-key.pem / server-cert.pem signed by ca-cert.pem with your LAN IP as a SAN
   ```
2. `vite.config.js` automatically serves HTTPS if `frontend/certs/server-key.pem` and `server-cert.pem` exist.
3. Copy `ca-cert.pem` into `frontend/public/` (e.g. as `civicmind-ca.crt`) so it's downloadable from the site.
4. On your phone, visit `https://<lan-ip>:3000/civicmind-ca.crt`, install it as a trusted CA certificate, then reload the site — Chrome will now offer a real "Install app" option.
5. The Express backend binds to all interfaces by default, so it's reachable at `http://<lan-ip>:5000` automatically — no extra config needed there.

`frontend/certs/` and the CA `.crt` are git-ignored; never commit private key material.

---

## 🔗 API Reference

### Auth & Users — `/api/users`
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| POST | `/api/users/register` | Register a new citizen | ❌ Public |
| POST | `/api/users/login` | Citizen login | ❌ Public |
| POST | `/api/users/admin-login` | Admin login | ❌ Public |
| POST | `/api/users/forgot-password` | Send reset email | ❌ Public |
| POST | `/api/users/reset-password` | Reset password with token | ❌ Public |
| GET | `/api/users/profile` | Get logged-in user profile | ✅ User |

### Complaints — `/api/complaints`
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| POST | `/api/complaints` | File a new complaint — geocodes location, runs Groq classification, checks for duplicates, auto-assigns | ✅ User |
| GET | `/api/complaints` | Get all complaints | ✅ Admin |
| GET | `/api/complaints/my` | Get current user's complaints | ✅ User |
| GET | `/api/complaints/groups` | Get deduplicated complaint groups | ✅ Admin |
| GET | `/api/complaints/flagged` | Get complaints flagged for manual review | ✅ Admin |
| PATCH | `/api/complaints/:id` | Update complaint status | ✅ Employee/Admin |
| POST | `/api/complaints/groups/:id/assign` | Assign a complaint group to an employee | ✅ Admin |

**`POST /api/complaints` request body:**
```json
{
  "complaint_id": "CMP-1788243411605",
  "description": "There is a large dangerous pothole on the main road causing accidents",
  "location": "19.0760,72.8777",
  "image": "data:image/jpeg;base64,...",
  "municipalityCode": "BMC",
  "user_id": "<mongo user _id>"
}
```

**Response (abridged):**
```json
{
  "message": "Complaint filed successfully",
  "complaint": {
    "sector": "potholes_and_roadcracks",
    "priority": "Critical",
    "status": "Assigned",
    "address": { "fullAddress": "...", "city": "Mumbai", "pincode": "400070" },
    "aiClassification": {
      "provider": "Groq",
      "model": "openai/gpt-oss-20b",
      "defectClass": "potholes_and_roadcracks",
      "confidence": 0.95,
      "confidenceTier": "HIGH_CONFIDENCE",
      "detectedIssue": "Large dangerous pothole on main road causing accidents",
      "evidence": "Text and image both confirm a sizable pothole indicating an immediate safety hazard."
    }
  },
  "deduplication": {
    "isNewGroup": true,
    "group": { "group_id": "GRP_...", "complaint_count": 1 }
  }
}
```

### Notices — `/api/notices`
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| GET | `/api/notices` | Get all notices | ❌ Public |
| POST | `/api/notices` | Create a notice | ✅ Admin |
| DELETE | `/api/notices/:id` | Delete a notice | ✅ Admin |

### Feedback — `/api/feedback`
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| POST | `/api/feedback` | Submit complaint feedback | ✅ User |
| GET | `/api/feedback` | Get all feedback | ✅ Admin |

---

## 🧠 AI Classification (Groq Multimodal LLM)

### How it works
1. The citizen's description and photo are sent together to a Groq vision-language model (`groqService.js`), guided by a structured prompt (`groqPrompt.js`) that enumerates the full defect taxonomy.
2. The model returns structured JSON: defect class, severity, confidence, a short evidence explanation, and (when relevant) the affected department.
3. `groqValidator.js` checks the response against the canonical taxonomy (`taxonomy.js`) — any invalid or malformed class is rejected rather than silently accepted.
4. `routingResolver.js` decides what happens next based on confidence: high-confidence results are auto-assigned to an available employee in the right department; low-confidence results are flagged for manual admin review instead.

### Defect Taxonomy (13 classes)
| Class | Department |
|---|---|
| Potholes and Road Cracks | Roads |
| Footpath and Paver Block Damage | Roads |
| Damaged or Missing Road Signs | Traffic / Roads |
| Unattended Garbage and Open Dumping | Waste Management |
| Dead Animals and Bio-Hazard Pollution | Waste Management |
| Drainage Clog and Monsoon Waterlogging | Water & Sanitation |
| Damaged or Tilted Electrical Poles | Electrical |
| Dangling Wires and Lighting Hazards | Electrical |
| Water Supply Pipeline Leaks and Bursts | Water & Sanitation |
| Damaged Bridges and Concrete Structures | Public Works |
| Fallen Trees and Dangerous Overhanging Branches | Parks / Public Safety |
| Graffiti, Unauthorized Posters, and Public Vandalism | Public Safety |
| Illegal Parking and Encroachment Obstruction | Traffic / Roads |

### Failure handling
If `GROQ_API_KEY` is missing, the API is unreachable, or the model returns an invalid response, the complaint is still saved with `status: "Flagged"` for manual admin review rather than being silently dropped — see `backend/tests/groqFailureHandling.test.js` for the covered failure modes.

---

## 🌐 SDG Alignment

| SDG | Goal | How CivicMind Contributes |
|---|---|---|
| 🏙️ **SDG 11** | Sustainable Cities and Communities | Faster, smarter resolution of urban civic issues |
| ⚖️ **SDG 16** | Peace, Justice & Strong Institutions | Transparent, accountable municipal governance |

---

## 👥 Team

| Name | Role |
|---|---|
| **Pranay Bhere** | Full Stack Developer |
| **Ved Sawant** | Full Stack Developer |
| **Vinay Patil** | Full Stack Developer |
| **Umesh Phulare** | Full Stack Developer |
| **Prof. Radhika B.** | Project Guide |

---

## 📜 License

This project is licensed under the **MIT License**.
See the [LICENSE](LICENSE) file for details.

---

## 📞 Contact & Support

If you face any issues while setting up or running the project:
- 🐛 Open a [GitHub Issue](https://github.com/pranay335/SIH_2026/issues)
- 📧 Contact any of the team members listed above

---

<div align="center">

Made with ❤️ for smarter, more responsive cities.

</div>
