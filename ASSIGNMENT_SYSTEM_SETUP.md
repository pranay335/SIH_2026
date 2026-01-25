# Employee Dashboard & Assignment Management System

## Features Implemented

### 1. **Employee Dashboard** (`employee_dashboard.jsx`)
- **Overview Section**: Real-time statistics and key metrics
  - Active tasks count
  - Completed tasks total
  - Current workload percentage
  - Performance success rate
- **My Tasks Section**: 
  - Visual status tracking (Pending → In Progress → Resolved → Completed)
  - Task detail view with complaint information
  - Camera capture for resolution images
  - Task status updates with real-time sync
- **Workload Management**:
  - Workload percentage and capacity management
  - Availability status indicator (AVAILABLE/BUSY/OFF_DUTY)
  - Priority distribution visualization
  - Overdue task alerts
- **Notices & Announcements**: View critical and high-priority notices
- **Auto-refresh**: 30-second polling for real-time updates

### 2. **Assignment Management System**
#### Backend (`Assignment Model & Controller`)
- **Auto-Assignment Engine**:
  - Intelligent employee matching based on sector expertise
  - Workload balancing algorithm
  - Performance scoring
  - Distance optimization
- **Manual Assignment**: Admin can manually assign complaints to employees
- **Workload Tracking**: 
  - Real-time capacity monitoring
  - Availability status updates
  - Performance metrics calculation
- **Assignment Status Flow**:
  - ASSIGNED → ACKNOWLEDGED → IN_PROGRESS → COMPLETED
  - Support for REJECTED and REASSIGNED states
- **Reassignment Support**: Reassign incomplete assignments with audit trail

#### Frontend (`AssignmentManagement.jsx`)
- **Dashboard Features**:
  - View all assignments with filtering (sector, status)
  - Real-time statistics dashboard
  - Quick action buttons
- **Auto-Assign Function**: One-click bulk assignment of pending complaints
- **Manual Assignment Modal**: Dropdown-based assignment interface
- **Detailed View**: Pop-up showing full assignment details
- **Reassignment UI**: Quick reassign dropdown for active assignments

### 3. **Extra Features**

#### Performance Analytics Component (`PerformanceAnalytics.jsx`)
- **Key Metrics**:
  - Success rate percentage
  - Average time to completion
  - Overdue task count
  - Efficiency score
- **Status Distribution**: Visual breakdown of all assignment states
- **Workload Details**: Capacity utilization and status indicators
- **Real-time Updates**: Automatic metric recalculation

#### Task Assignment Card Component (`TaskAssignmentCard.jsx`)
- **Smart Card Display**:
  - Priority indicators with color coding
  - Auto-assigned badge
  - Overdue warnings
  - Days remaining calculation
- **Progress Bar**: Visual progress from pending to completion
- **Quick Actions**: View details, reassign, mark complete buttons
- **Responsive Design**: Works on mobile, tablet, and desktop

#### Notification System (`NotificationSystem.jsx`)
- **Toast Notifications**: Success, error, warning, and info types
- **Auto-dismiss**: Automatic removal after 5 seconds
- **Custom Hook**: `useNotification()` for easy integration
- **Non-blocking**: Appears in top-right corner

### 4. **Backend API Endpoints**

#### Assignment Routes (`/api/assignments`)

**Employee Routes** (Protected - requires auth):
- `GET /my-tasks` - Get employee's assigned tasks
- `GET /workload` - Get workload and capacity info
- `GET /:assignmentId` - Get assignment details
- `PUT /:assignmentId/status` - Update assignment status with notes/images

**Admin Routes** (Protected - requires admin role):
- `GET /` - Get all assignments with filters
- `POST /assign` - Manual assignment of complaint to employee
- `POST /auto-assign` - Bulk auto-assignment
- `PUT /:assignmentId/reassign` - Reassign to another employee

### 5. **Database Schema**

**Assignment Model**:
```javascript
{
  assignmentId: String (unique),
  complaintId: ObjectId (ref: Complaint),
  assignedTo: ObjectId (ref: User),
  assignedBy: ObjectId (ref: User),
  status: ASSIGNED|ACKNOWLEDGED|IN_PROGRESS|COMPLETED|REJECTED|REASSIGNED,
  priority: LOW|MEDIUM|HIGH|CRITICAL,
  dueDate: Date,
  estimatedCompletionTime: Number (hours),
  actualCompletionTime: Number (hours),
  notes: String,
  resolutionNotes: String,
  resolutionImages: [{url, uploadedAt}],
  sector: String (enum),
  isAutoAssigned: Boolean,
  autoAssignmentReason: String,
  reassignmentHistory: [{from, to, reason, reassignedAt}],
  acknowledgedAt: Date,
  startedAt: Date,
  completedAt: Date,
  timestamps: true
}
```

## Installation & Setup

### 1. Backend Setup

1. **Update `package.json`** (Already done - no extra packages needed)

2. **The following files have been created/updated**:
   - `/backend/src/models/Assignment.js` - Assignment model
   - `/backend/src/controllers/assignmentController.js` - Business logic
   - `/backend/src/routes/assignmentRoutes.js` - API routes

3. **No additional npm packages required** - Uses existing dependencies

### 2. Frontend Setup

1. **New Files Created**:
   - `/frontend/src/pages/employee_dashboard.jsx` - Enhanced with all features
   - `/frontend/src/pages/AssignmentManagement.jsx` - Admin assignment management
   - `/frontend/src/components/PerformanceAnalytics.jsx` - Analytics component
   - `/frontend/src/components/TaskAssignmentCard.jsx` - Reusable card component
   - `/frontend/src/components/NotificationSystem.jsx` - Toast notifications

2. **Updated Files**:
   - `/frontend/src/App.jsx` - Added assignment management route

3. **Environment Variables** (Already in `.env` or `vite.config.js`):
   ```
   VITE_API_BASE_URL=http://localhost:3000/api
   ```

## Running the Application

### 1. Start Backend
```bash
cd backend
npm install
npm start
# or for development with auto-reload:
npm run dev
```

### 2. Start Frontend
```bash
cd frontend
npm install
npm run dev
```

### 3. Access the Application
- **User Dashboard**: `http://localhost:5173/user-dashboard`
- **Employee Dashboard**: `http://localhost:5173/employee-dashboard`
- **Admin Dashboard**: `http://localhost:5173/admin-dashboard`
- **Assignment Management**: `http://localhost:5173/admin/assignments`

## Key Features Explained

### Auto-Assignment Algorithm
```javascript
1. Get pending complaints
2. For each complaint:
   - Find employees in the sector (department match)
   - Filter available employees (status != OFF_DUTY)
   - Score by: performance (50%) + available capacity (50%)
   - Assign to highest-scoring employee
3. Create assignment record
4. Update complaint status
5. Update employee workload count
```

### Workload Management
```javascript
- Active Assignments = tasks in [ASSIGNED, ACKNOWLEDGED, IN_PROGRESS]
- Workload % = (active / maxCapacity) × 100
- Availability:
  - < 70%: AVAILABLE (green)
  - 70-90%: BUSY (yellow)
  - > 90%: OFF_DUTY (red)
```

### Task Status Lifecycle
```
┌─────────┐     ┌──────────────┐     ┌────────────┐     ┌──────────┐
│ ASSIGNED │ → │ ACKNOWLEDGED │ → │ IN_PROGRESS │ → │ COMPLETED │
└─────────┘     └──────────────┘     └────────────┘     └──────────┘
     ↓
   REJECTED (if employee rejects)
     
     ↓
REASSIGNED (if admin reassigns)
```

## Testing the System

### 1. Employee Workflow
1. Log in as employee
2. Go to Employee Dashboard
3. View assigned tasks in "My Tasks" section
4. Click on task to view details
5. Click "Acknowledge" to accept task
6. Click "Mark Resolved" to mark as in progress
7. Capture photos with camera
8. Submit completion

### 2. Admin Workflow
1. Log in as admin
2. Go to Assignment Management (`/admin/assignments`)
3. View all assignments with stats
4. Click "Auto-Assign All" to auto-assign pending complaints
5. Or use "Manual Assignment" to assign specific complaints
6. Click on assignment to view details and reassign if needed

### 3. Workload Tracking
1. Go to Employee Dashboard
2. Check "Workload" section
3. See capacity utilization and availability status
4. View priority distribution and overdue tasks

## API Response Examples

### Get My Tasks
```json
{
  "success": true,
  "data": [
    {
      "_id": "...",
      "assignmentId": "ASG-abc123",
      "status": "IN_PROGRESS",
      "priority": "HIGH",
      "complaintId": {...},
      "assignedTo": {...},
      "dueDate": "2024-01-27T00:00:00Z",
      "acknowledgedAt": "2024-01-25T10:30:00Z",
      "startedAt": "2024-01-25T10:35:00Z"
    }
  ]
}
```

### Get Workload
```json
{
  "success": true,
  "data": {
    "activeAssignments": 5,
    "maxCapacity": 10,
    "workloadPercentage": 50,
    "availabilityStatus": "AVAILABLE",
    "priorityDistribution": [
      {"_id": "HIGH", "count": 2},
      {"_id": "MEDIUM", "count": 3}
    ],
    "overdueCount": 0
  }
}
```

## Troubleshooting

### Common Issues

1. **API Connection Error**
   - Check if backend is running on port 3000
   - Verify VITE_API_BASE_URL in frontend config
   - Check browser console for CORS errors

2. **Auto-Assignment Not Working**
   - Ensure employees have department field set
   - Check if employees have availabilityStatus != OFF_DUTY
   - Verify complaints have sector field

3. **Workload Not Updating**
   - Wait for next auto-refresh (30 seconds)
   - Click "Refresh" button to manually fetch
   - Check browser console for API errors

4. **Camera Not Working**
   - Allow camera permissions in browser
   - Check if browser supports getUserMedia API
   - Use HTTPS or localhost for camera access

## Future Enhancements

1. **Real-time Updates**: WebSocket integration for instant updates
2. **Mobile App**: React Native version for field employees
3. **Advanced Analytics**: Historical data and trend analysis
4. **Scheduling**: Employee shift and availability scheduling
5. **Route Optimization**: Google Maps integration for route planning
6. **Feedback System**: Customer satisfaction ratings and reviews
7. **Export Reports**: PDF and Excel export functionality
8. **Bulk Operations**: Bulk reassign, bulk status update
9. **Notifications**: Email and SMS alerts for overdue tasks
10. **ML Predictions**: Predict completion time based on patterns
