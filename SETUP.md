# CivicMind - AI-Enabled Municipal Grievance Management System

## Environment Setup

### Required Environment Variables

Create a `.env` file in the backend directory with the following variables:

```env
# Database
MONGO_URI=mongodb://localhost:27017/civicmind

# JWT
JWT_SECRET=your_jwt_secret_key_here

# Server
PORT=5000

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:3000
```

### MongoDB Setup

1. Install MongoDB on your system
2. Start MongoDB service:
   - Windows: `net start MongoDB`
   - Mac/Linux: `brew services start mongodb-community` or `sudo systemctl start mongod`
3. Verify MongoDB is running on `mongodb://localhost:27017`

### Backend Setup

1. Navigate to backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create `.env` file with required variables (see above)

4. Run seed data to create default users:
   ```bash
   node seedData.js
   ```

5. Start the backend server:
   ```bash
   npm start
   ```

The backend will be available at `http://localhost:5000`

### Frontend Setup

1. Navigate to frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create `.env` file:
   ```env
   VITE_API_BASE_URL=http://localhost:5000/api
   VITE_ML_API_BASE_URL=http://localhost:8000
   ```

4. Start the frontend:
   ```bash
   npm start
   ```

The frontend will be available at `http://localhost:3000`

### ML Backend Setup (Optional)

1. Navigate to ML backend directory:
   ```bash
   cd ml_backend
   ```

2. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Start the ML backend:
   ```bash
   python app.py
   ```

The ML backend will be available at `http://localhost:8000`

## Default Login Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@civicmind.com | admin123 |
| Employee | employee@civicmind.com | employee123 |
| Citizen | user@civicmind.com | user123 |

## Features Implemented

### ✅ Core Features
- User authentication (Citizen, Admin, Employee)
- Complaint filing with ML predictions
- Smart auto-assignment of complaints
- Multi-municipality support
- Employee dashboard with workload management
- Admin employee management
- Notice and announcement system
- Image authenticity checks
- Aadhaar verification (sandbox mode)

### 🔧 Technical Features
- React.js frontend with Tailwind CSS
- Node.js/Express backend with MongoDB
- FastAPI ML backend
- JWT-based authentication
- Role-based access control
- Real-time assignment logic
- Image hashing for duplicate detection

## API Endpoints

### Authentication
- `POST /api/users/login` - User login
- `POST /api/users/register` - User registration
- `POST /api/users/create-admin` - Create admin (initial setup)

### Employee Management (Admin Only)
- `POST /api/users/create-employee` - Create new employee
- `GET /api/users/employees` - Get all employees

### Complaints
- `POST /api/complaints` - File new complaint
- `GET /api/complaints` - Get all complaints
- `GET /api/complaints/user/:userId` - Get user complaints

### Assignments
- `POST /api/assignments/auto-assign` - Auto-assign complaint
- `GET /api/assignments/employee/:employeeId` - Get employee assignments
- `PUT /api/assignments/:id` - Update assignment status

### Aadhaar Verification
- `POST /api/aadhaar/send-otp` - Send OTP (sandbox)
- `POST /api/aadhaar/verify-otp` - Verify OTP
- `GET /api/aadhaar/status` - Get verification status

### Notices
- `POST /api/notices` - Create notice (admin)
- `GET /api/notices` - Get municipality notices

## Troubleshooting

### Backend Issues
- Ensure MongoDB is running
- Check `.env` file configuration
- Verify port 5000 is not in use

### Frontend Issues
- Ensure backend is running on port 5000
- Check API base URL in `.env`
- Verify port 3000 is not in use

### Database Issues
- Clear MongoDB collections if needed
- Re-run seed data script
- Check MongoDB connection string

## Development Notes

- The system uses rule-based municipality detection from location text
- ML backend is optional - system works with mock predictions
- Aadhaar verification uses static OTP "123456" for sandbox mode
- Image authenticity checks use SHA-256 hashing
- Auto-assignment considers employee workload and department matching
