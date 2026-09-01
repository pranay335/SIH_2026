<div align="center">

# 🏙️ CivicMind
### AI-Enabled Municipal Grievance Management System

*Empowering citizens. Streamlining governance. Powered by AI.*

![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.104-009688?style=for-the-badge&logo=fastapi&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-8.0-47A248?style=for-the-badge&logo=mongodb&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)
![Python](https://img.shields.io/badge/Python-3.9+-3776AB?style=for-the-badge&logo=python&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)

</div>

---

## 📖 About the Project

**CivicMind** is a full-stack, AI-powered civic grievance management platform designed to bridge the gap between citizens and municipal authorities.

Citizens can file complaints with a description, photo, and GPS-detected location. The platform's **AI engine automatically classifies the complaint's sector** (Road & Infrastructure, Water & Sanitation, Waste Management, etc.) **and severity** (Low / Medium / High) — eliminating manual categorization. Admins then assign complaints to field employees, who resolve them and update statuses in real time. Citizens can track every step of the process through their personal dashboard.

The system is built around **three dedicated portals** — Citizen, Admin, and Employee — each with a tailored, role-based interface built with a modern dark glassmorphism UI.

> 🎯 Aligned with **SDG 11** (Sustainable Cities) and **SDG 16** (Peace, Justice & Strong Institutions).

---

## 🏗️ System Architecture

CivicMind is a **three-tier architecture** with a React SPA on the frontend, an Express REST API on the backend, and a FastAPI microservice handling all ML predictions.

```
┌─────────────────────────────────────┐
│       React Frontend (Vite)         │  http://localhost:5173
│   Citizen | Admin | Employee UI     │
└──────────────┬──────────────────────┘
               │  REST API calls
               ▼
┌─────────────────────────────────────┐
│    Node.js / Express.js Backend     │  http://localhost:5000
│  Auth · Complaints · Notices ·      │
│  Feedback · Employees · Messages    │
└──────┬───────────────────┬──────────┘
       │  Mongoose ODM     │  ML prediction calls
       ▼                   ▼
┌─────────────┐   ┌────────────────────────────┐
│   MongoDB   │   │   FastAPI ML Microservice   │  http://localhost:8000
│  (Atlas or  │   │  ├─ NLP Model (Keras .h5)  │
│   Local)    │   │  │  text → sector + severity│
└─────────────┘   │  └─ CNN Model (ResNet-50)  │
                  │     image → issue type      │
                  └────────────────────────────┘
```

### Port Reference

| Service | Technology | Default Port |
|---|---|---|
| Frontend | React + Vite | `5173` |
| Backend API | Node.js + Express | `5000` |
| ML Service | FastAPI + Uvicorn | `8000` |
| Database | MongoDB | `27017` |

---

## ✨ Features

### 👤 Citizen Portal
- 📝 Register and login with secure JWT authentication
- 📸 File complaints with text description, photo upload / live camera capture
- 📍 Auto GPS location detection on complaint submission
- 🤖 AI auto-categorizes issue sector and severity instantly
- 📊 Real-time dashboard — track complaint status (Pending → In Progress → Resolved)
- 📢 View official municipal notices and announcements
- ⭐ Submit feedback and ratings on resolved complaints
- 🔑 Forgot password / reset password via email

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

### 🤖 AI / ML Engine
- **NLP Model** — Classifies free-text complaint description into sector and severity with confidence score
- **CNN Model** (ResNet-50) — Classifies complaint image into issue type (Pothole, Water Leak, etc.) with confidence score
- **Graceful fallback** — If models are loading or unavailable, a keyword-based rule engine ensures zero downtime
- Dual-model combined result returned as a single prediction object per complaint

---

## 🛠️ Tech Stack

### Frontend
| Technology | Version | Purpose |
|---|---|---|
| React | 19 | UI framework |
| Vite | 7 | Build tool & dev server |
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
| JSON Web Token | 9 | Authentication tokens |
| bcryptjs | 3 | Password hashing |
| Multer | 2 | Image / file upload handling |
| Nodemailer | 8 | Password reset emails |
| Sharp | 0.34 | Server-side image processing |
| CORS | 2.8 | Cross-origin request handling |

### ML Backend
| Technology | Version | Purpose |
|---|---|---|
| FastAPI | 0.104 | High-performance ML API |
| Uvicorn | 0.24 | ASGI server |
| TensorFlow / Keras | 2.15 | NLP model inference |
| PyTorch | 2.1 | CNN model inference |
| torchvision | 0.16 | Image transforms + ResNet-50 |
| Scikit-learn | 1.3 | Label encoders (sector/severity) |
| Pillow | 10.1 | Image loading & preprocessing |
| NumPy | 1.24 | Array operations |

---

## 📁 Project Structure

```
civic_mind/
│
├── frontend/                        # React + Vite Single Page Application
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
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
│       └── services/                # Axios API call wrappers
│
├── backend/                         # Node.js + Express REST API
│   ├── package.json
│   ├── .env.example
│   └── src/
│       ├── index.js                 # App entry — mounts all routes
│       ├── config/
│       │   └── database.js          # MongoDB connection
│       ├── models/                  # Mongoose schemas
│       │   ├── User.js
│       │   ├── Complaint.js
│       │   ├── ComplaintGroup.js
│       │   ├── Notice.js
│       │   └── Message.js
│       ├── controllers/             # Business logic handlers
│       │   ├── userController.js
│       │   ├── complaintController.js
│       │   ├── noticeController.js
│       │   ├── feedbackController.js
│       │   └── messageController.js
│       ├── routes/                  # Express route definitions
│       │   ├── userRoutes.js
│       │   ├── complaintRoutes.js
│       │   ├── noticeRoutes.js
│       │   ├── feedbackRoutes.js
│       │   └── messageRoutes.js
│       ├── middleware/
│       │   ├── auth.js              # JWT verification
│       │   ├── adminAuth.js         # Admin-only guard
│       │   └── errorHandler.js
│       ├── services/                # Reusable service logic
│       └── utils/                   # Helper utilities
│
└── ml_backend/                      # FastAPI ML Microservice
    ├── app.py                       # Main FastAPI app + endpoints
    ├── requirements.txt
    └── ML_models/
        ├── NLP.h5                   # Keras LSTM — text classification
        ├── tokenizer.pkl            # Keras tokenizer
        ├── sector_encoder.pkl       # Label encoder (sector)
        ├── severity_encoder.pkl     # Label encoder (severity)
        └── cnn.pth                  # PyTorch ResNet-50 — image classification
```

---

## ✅ Prerequisites

Make sure the following are installed before setting up:

| Tool | Version | Download |
|---|---|---|
| Node.js | v18 or above | https://nodejs.org |
| Python | 3.9 or above | https://python.org |
| MongoDB | Local or Atlas | https://mongodb.com |
| Git | Latest | https://git-scm.com |

Verify your setup:
```bash
node -v
npm -v
python --version
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
```

> **MongoDB Atlas**: Replace `MONGODB_URI` with your Atlas connection string:
> `mongodb+srv://<username>:<password>@cluster.mongodb.net/complaints_db`

---

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/pranay335/civic_mind.git
cd civic_mind
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

✅ Frontend running at `http://localhost:5173`

---

### 4. ML Backend Setup

Open another terminal:

```bash
cd ml_backend

# Create and activate a virtual environment
python -m venv venv

# Windows
venv\Scripts\activate

# Linux / macOS
# source venv/bin/activate

pip install -r requirements.txt
python app.py
```

✅ ML service running at `http://localhost:8000`

> ⚠️ **ML Model Files**: The model files (`NLP.h5`, `cnn.pth`, `tokenizer.pkl`, etc.) must be present inside `ml_backend/ML_models/`. If they are missing, the system will automatically fall back to keyword-based mock predictions — the app remains fully functional.

---

### 5. Run All Three Together

For convenience, open three separate terminals and run:

| Terminal | Command |
|---|---|
| Terminal 1 | `cd backend && npm run dev` |
| Terminal 2 | `cd frontend && npm run dev` |
| Terminal 3 | `cd ml_backend && python app.py` |

Then open your browser at **http://localhost:5173**

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
| POST | `/api/complaints` | File a new complaint | ✅ User |
| GET | `/api/complaints` | Get all complaints | ✅ Admin |
| GET | `/api/complaints/my` | Get current user's complaints | ✅ User |
| PATCH | `/api/complaints/:id` | Update complaint status | ✅ Employee/Admin |
| POST | `/api/complaints/:id/assign` | Assign complaint to employee | ✅ Admin |

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

### ML Service — `http://localhost:8000`
| Method | Endpoint | Description |
|---|---|---|
| GET | `/` | Health check — model load status |
| POST | `/predict` | Predict sector, severity, and image class |

**`/predict` Request (multipart/form-data):**
```
description: "There is a large pothole on main road near the bus stop"
image: <image file>
```

**`/predict` Response:**
```json
{
  "message": "Complaint filed successfully",
  "complaint": {
    "complaint_id": "COMP-20260619123456-a1b2c3d4",
    "nlp_result": {
      "predicted_sector": "Road & Infrastructure",
      "predicted_severity": "High",
      "sector_confidence": 0.91,
      "severity_confidence": 0.87
    },
    "cnn_result": {
      "predicted_class": "Pothole",
      "confidence": 0.94
    },
    "status": "Pending"
  }
}
```

---

## 🧠 ML Models

### NLP Model — Text Classification (`NLP.h5`)
- **Architecture**: LSTM-based neural network (TensorFlow/Keras)
- **Input**: Free-text complaint description (cleaned, tokenized, padded to 50 tokens)
- **Output**:
  - **Sector** — one of: Road & Infrastructure, Water & Sanitation, Waste Management, Street Lighting, Public Safety
  - **Severity** — one of: Low, Medium, High
  - Confidence scores for both outputs

### CNN Model — Image Classification (`cnn.pth`)
- **Architecture**: ResNet-50 (pretrained backbone, fine-tuned classification head)
- **Framework**: PyTorch + torchvision
- **Input**: Complaint photo (resized to 224×224, ImageNet-normalized)
- **Output**: Predicted issue class (Pothole, Broken Street Light, Water Leak, Garbage Accumulation, Blocked Drain) + confidence score

### Fallback Mechanism
If model files are absent or still loading on startup, the system switches to a **rule-based fallback**:
- Keywords like `"pothole"`, `"road"` → Road & Infrastructure
- Keywords like `"water"`, `"leak"` → Water & Sanitation
- `"urgent"`, `"danger"` → High severity

This ensures **zero downtime** even without the ML models.

---

## 🌐 SDG Alignment

This project directly supports the United Nations Sustainable Development Goals:

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
- 🐛 Open a [GitHub Issue](https://github.com/pranay335/civic_mind/issues)
- 📧 Contact any of the team members listed above

---

<div align="center">

Made with ❤️ for smarter, more responsive cities.

</div>
