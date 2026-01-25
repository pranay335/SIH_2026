# API Reference Guide - Assignment System

## Base URL
```
http://localhost:3000/api/assignments
```

## Authentication
All endpoints (except health check) require Bearer token in Authorization header:
```
Authorization: Bearer <JWT_TOKEN>
```

---

## Endpoints

### 1. Get My Assignments (Employee)
**GET** `/my-tasks`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "id123",
      "assignmentId": "ASG-abc123",
      "complaintId": {
        "_id": "comp123",
        "description": "Pothole on Main Street",
        "location": "Main St, Downtown",
        "sector": "Roads",
        "nlp_result": {
          "predicted_sector": "Roads",
          "predicted_severity": "HIGH"
        }
      },
      "assignedTo": "emp123",
      "status": "IN_PROGRESS",
      "priority": "HIGH",
      "dueDate": "2024-01-27T00:00:00Z",
      "acknowledgedAt": "2024-01-25T10:30:00Z",
      "startedAt": "2024-01-25T10:35:00Z",
      "completedAt": null,
      "notes": "On the way to site",
      "sector": "Roads",
      "isAutoAssigned": true,
      "createdAt": "2024-01-25T10:00:00Z"
    }
  ],
  "count": 1
}
```

---

### 2. Get Workload Status (Employee)
**GET** `/workload`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "activeAssignments": 5,
    "maxCapacity": 10,
    "workloadPercentage": 50,
    "availabilityStatus": "AVAILABLE",
    "priorityDistribution": [
      {
        "_id": "HIGH",
        "count": 2
      },
      {
        "_id": "MEDIUM",
        "count": 3
      }
    ],
    "statusDistribution": [
      {
        "_id": "IN_PROGRESS",
        "count": 3
      },
      {
        "_id": "ASSIGNED",
        "count": 2
      }
    ],
    "overdueCount": 0,
    "isAvailable": true
  }
}
```

---

### 3. Update Assignment Status (Employee)
**PUT** `/:assignmentId/status`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "status": "IN_PROGRESS",
  "notes": "Started work on site",
  "images": ["base64_image1", "base64_image2"]
}
```

**Status Values:**
- `ACKNOWLEDGED` - Employee acknowledges the task
- `IN_PROGRESS` - Employee starts working on task
- `COMPLETED` - Task is finished
- `REJECTED` - Employee rejects the task

**Response (200):**
```json
{
  "success": true,
  "message": "Assignment status updated successfully",
  "data": {
    "_id": "id123",
    "assignmentId": "ASG-abc123",
    "status": "IN_PROGRESS",
    "startedAt": "2024-01-25T10:35:00Z",
    "actualCompletionTime": null,
    "complaintId": {...},
    "assignedTo": {...}
  }
}
```

---

### 4. Get All Assignments (Admin)
**GET** `/`

**Query Parameters:**
```
?sector=Roads&status=IN_PROGRESS&employeeId=emp123&page=1&limit=10
```

**Headers:**
```
Authorization: Bearer <admin_token>
Content-Type: application/json
```

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "id123",
      "assignmentId": "ASG-abc123",
      "complaintId": {...},
      "assignedTo": {
        "_id": "emp123",
        "name": "John Doe",
        "email": "john@example.com",
        "department": "Roads"
      },
      "status": "IN_PROGRESS",
      "priority": "HIGH",
      "sector": "Roads",
      "isAutoAssigned": true,
      "isOverdue": false,
      "timeElapsed": 2
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "pages": 3
  }
}
```

---

### 5. Manual Assignment (Admin)
**POST** `/assign`

**Headers:**
```
Authorization: Bearer <admin_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "complaintId": "comp123",
  "employeeId": "emp456",
  "priority": "HIGH",
  "estimatedTime": 24,
  "dueDate": "2024-01-27T00:00:00Z"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Complaint assigned successfully",
  "data": {
    "_id": "id123",
    "assignmentId": "ASG-def456",
    "complaintId": {...},
    "assignedTo": {
      "_id": "emp456",
      "name": "Jane Smith",
      "email": "jane@example.com"
    },
    "assignedBy": {
      "_id": "admin123",
      "name": "Admin User",
      "email": "admin@example.com"
    },
    "status": "ASSIGNED",
    "priority": "HIGH",
    "dueDate": "2024-01-27T00:00:00Z",
    "estimatedCompletionTime": 24
  }
}
```

---

### 6. Auto-Assign Complaints (Admin)
**POST** `/auto-assign`

**Headers:**
```
Authorization: Bearer <admin_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "complaintIds": ["comp1", "comp2", "comp3"]
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Auto-assignment completed. 2 assigned, 1 failed",
  "data": {
    "assigned": [
      {
        "_id": "id123",
        "assignmentId": "ASG-auto1",
        "assignedTo": "emp789",
        "status": "ASSIGNED"
      },
      {
        "_id": "id124",
        "assignmentId": "ASG-auto2",
        "assignedTo": "emp790",
        "status": "ASSIGNED"
      }
    ],
    "failed": [
      {
        "complaintId": "comp3",
        "reason": "No available employees in this sector"
      }
    ]
  }
}
```

---

### 7. Reassign Assignment (Admin)
**PUT** `/:assignmentId/reassign`

**Headers:**
```
Authorization: Bearer <admin_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "newEmployeeId": "emp999",
  "reason": "Previous employee unavailable due to medical leave"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Assignment reassigned successfully",
  "data": {
    "_id": "id123",
    "assignmentId": "ASG-abc123",
    "assignedTo": {
      "_id": "emp999",
      "name": "New Employee",
      "email": "new@example.com"
    },
    "status": "REASSIGNED",
    "reassignmentHistory": [
      {
        "from": "emp456",
        "to": "emp999",
        "reason": "Previous employee unavailable due to medical leave",
        "reassignedAt": "2024-01-25T11:00:00Z"
      }
    ]
  }
}
```

---

### 8. Get Assignment Details
**GET** `/:assignmentId`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "_id": "id123",
    "assignmentId": "ASG-abc123",
    "complaintId": {
      "_id": "comp123",
      "description": "Water leakage",
      "location": "Park Ave",
      "sector": "Water",
      "image": "base64_image_data"
    },
    "assignedTo": {
      "_id": "emp123",
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "+1234567890",
      "designation": "Senior Technician",
      "department": "Water"
    },
    "assignedBy": {
      "_id": "admin123",
      "name": "Admin User",
      "email": "admin@example.com"
    },
    "status": "COMPLETED",
    "priority": "HIGH",
    "dueDate": "2024-01-27T00:00:00Z",
    "estimatedCompletionTime": 24,
    "actualCompletionTime": 18,
    "notes": "Initial assessment completed",
    "resolutionNotes": "Replaced water pipe. Issue resolved.",
    "resolutionImages": [
      {
        "url": "base64_image_data",
        "uploadedAt": "2024-01-25T14:30:00Z"
      }
    ],
    "acknowledgedAt": "2024-01-25T10:30:00Z",
    "startedAt": "2024-01-25T10:35:00Z",
    "completedAt": "2024-01-25T14:30:00Z",
    "isAutoAssigned": true,
    "autoAssignmentReason": "Auto-assigned based on sector expertise and workload",
    "reassignmentHistory": [],
    "timeElapsed": 4,
    "isOverdue": false
  }
}
```

---

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "message": "Valid complaint IDs array required"
}
```

### 401 Unauthorized
```json
{
  "message": "No token, authorization denied"
}
```

### 403 Forbidden
```json
{
  "success": false,
  "message": "Access denied. Admin privileges required."
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "Assignment not found"
}
```

### 500 Server Error
```json
{
  "success": false,
  "message": "Error fetching assignments",
  "error": "Error details"
}
```

---

## Status Codes Reference

| Code | Meaning |
|------|---------|
| 200 | Success |
| 400 | Bad Request |
| 401 | Unauthorized (Missing/Invalid token) |
| 403 | Forbidden (Insufficient permissions) |
| 404 | Not Found |
| 500 | Server Error |

---

## Assignment Status Flow

```
                    ┌──────────────┐
                    │   ASSIGNED   │
                    └────┬─────────┘
                         │
                    ┌────▼─────────┐
                    │ ACKNOWLEDGED │
                    └────┬─────────┘
                         │
                    ┌────▼─────────┐
        ┌──────────▶│ IN_PROGRESS  │◀──────────┐
        │           └────┬─────────┘           │
   REJECTED             │                      │
        │         ┌─────▼────────┐       REASSIGNED
        │         │  COMPLETED   │
        │         └──────────────┘
        │
   Employee rejects
   the task
```

---

## Assignment Priority Levels

| Priority | Typical SLA | Color |
|----------|-----------|-------|
| CRITICAL | 4 hours | 🔴 Red |
| HIGH | 24 hours | 🟠 Orange |
| MEDIUM | 48 hours | 🟡 Yellow |
| LOW | 7 days | 🟢 Green |

---

## Availability Status Explanation

| Status | Condition | Description |
|--------|-----------|-------------|
| AVAILABLE | Workload < 70% | Employee can accept new tasks |
| BUSY | 70% ≤ Workload < 90% | Employee has high workload |
| OFF_DUTY | Workload ≥ 90% | Employee at capacity, no new tasks |

---

## Example cURL Commands

### Get My Tasks
```bash
curl -X GET "http://localhost:3000/api/assignments/my-tasks" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

### Get Workload
```bash
curl -X GET "http://localhost:3000/api/assignments/workload" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

### Update Status
```bash
curl -X PUT "http://localhost:3000/api/assignments/ASSIGNMENT_ID/status" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "COMPLETED",
    "notes": "Task completed successfully",
    "images": ["image_base64_data"]
  }'
```

### Auto-Assign
```bash
curl -X POST "http://localhost:3000/api/assignments/auto-assign" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "complaintIds": ["id1", "id2", "id3"]
  }'
```
