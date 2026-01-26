# Complaint Deduplication & Clubbing System

## 🎯 **Overview**

This system automatically groups similar complaints together to prevent municipal employees from receiving duplicate reports of the same issue. It uses intelligent algorithms to detect similarity based on location, description, and sector classification.

## 🔄 **How It Works**

### 1. **Automatic Deduplication Process**
When a new complaint is filed, the system:

1. **Extracts Features**: Location, description, sector, municipality code
2. **Finds Similar Groups**: Searches for existing complaint groups within 200m radius
3. **Calculates Similarity**: Uses semantic analysis and location proximity
4. **Groups or Creates**: Either adds to existing group or creates new group
5. **Updates Assignment**: All complaints in a group are assigned to the same employee

### 2. **Similarity Algorithm**

The system uses a weighted scoring system:

```javascript
Overall Similarity = (Semantic Score × 0.3) + 
                   (Location Proximity × 0.4) + 
                   (Sector Match × 0.3)
```

- **Semantic Similarity**: Text analysis of complaint descriptions
- **Location Proximity**: Distance-based scoring (200m threshold)
- **Sector Match**: Exact sector classification matching

**Threshold**: 70% similarity required for grouping

## 📊 **Data Models**

### ComplaintGroup Model
```javascript
{
  group_id: "GRP_1642581234567_ABC123",
  issue_title: "Broken water pipe",
  issue_description: "Water pipe leaking on main road",
  centroid_location: { type: "Point", coordinates: [lng, lat] },
  address: { fullAddress: "123 Main St, Mumbai" },
  sector: "Water Supply",
  municipalityCode: "BMC",
  assigned_to: ObjectId, // Employee ID
  status: "Pending", // Pending, Assigned, In Progress, Resolved, Closed
  priority: "High", // Low, Medium, High, Critical
  complaint_count: 5,
  affected_users: [ObjectId], // Users who reported
  complaints: [ObjectId], // Individual complaint IDs
  severity_distribution: { low: 1, medium: 2, high: 2 },
  representative_images: ["image1.jpg", "image2.jpg"]
}
```

### Updated Complaint Model
```javascript
{
  // ... existing fields ...
  group_id: ObjectId, // Reference to ComplaintGroup
  // ... other fields ...
}
```

## 🚀 **API Endpoints**

### Core Deduplication
- `POST /api/complaints` - Files complaint with automatic deduplication
- `GET /api/complaints/deduplication-stats` - Get deduplication statistics

### Group Management
- `GET /api/complaints/groups` - Get all complaint groups
- `GET /api/complaints/groups/:groupId` - Get specific group details
- `PUT /api/complaints/groups/:groupId/assign` - Assign group to employee
- `PUT /api/complaints/groups/:groupId/status` - Update group status

## 📈 **Benefits**

### For Municipal Employees
- **Reduced Workload**: One assignment instead of multiple similar complaints
- **Better Context**: See all related complaints together
- **Priority Management**: Aggregated severity determines group priority
- **Efficient Resolution**: Single action resolves multiple complaints

### For Citizens
- **Faster Response**: Higher priority for grouped issues
- **Better Tracking**: See consolidated progress
- **Reduced Duplication**: System prevents duplicate reporting

### For Administration
- **Resource Optimization**: Better allocation of municipal resources
- **Data Insights**: Identify problem hotspots
- **Performance Metrics**: Track resolution efficiency

## 🔧 **Configuration**

### Deduplication Parameters
```javascript
// In deduplicationService.js
const config = {
  locationThreshold: 200, // meters
  semanticThreshold: 0.7, // 70% similarity
  sectorWeight: 0.3,
  locationWeight: 0.4,
  semanticWeight: 0.3
};
```

### Customization Options
- Adjust location threshold based on urban density
- Modify similarity weights for different sectors
- Add custom similarity algorithms
- Configure priority aggregation rules

## 📝 **Example Workflow**

### Scenario: Multiple Water Pipe Reports

1. **First Complaint**: "Water pipe broken on Main Street"
   - Creates new group: `GRP_001`
   - Status: Pending
   - Priority: Medium

2. **Second Complaint**: "Leaking water pipe near Main Street" (50m away)
   - Finds existing group `GRP_001`
   - Similarity: 85% (above threshold)
   - Adds to existing group
   - Group priority updates to High (aggregated severity)

3. **Third Complaint**: "Broken water main on Main Street" (100m away)
   - Finds existing group `GRP_001`
   - Similarity: 78% (above threshold)
   - Adds to existing group
   - Group priority updates to Critical

4. **Assignment**: Municipal employee assigned to `GRP_001`
   - All 3 complaints assigned to same employee
   - Single resolution action resolves all complaints

## 🎛️ **Admin Dashboard Features**

### Group Statistics
- Total groups vs individual complaints
- Deduplication rate percentage
- Average complaints per group
- Groups by status and priority

### Group Management
- View all complaint groups
- Assign groups to employees
- Update group status
- Add notes and resolution details
- Track resolution time

### Analytics
- Hotspot identification
- Sector-wise grouping patterns
- Resolution efficiency metrics
- Citizen satisfaction correlation

## 🔍 **Monitoring & Debugging**

### Logs
Each deduplication action logs:
- New group creation
- Complaint addition to existing group
- Similarity scores
- Assignment updates

### Statistics API
```javascript
GET /api/complaints/deduplication-stats

Response:
{
  "success": true,
  "stats": {
    "totalGroups": 150,
    "totalComplaints": 450,
    "avgComplaintsPerGroup": 3.0,
    "deduplicationRate": "66.67",
    "groupsByStatus": [
      { "_id": "Pending", "count": 45 },
      { "_id": "Assigned", "count": 60 },
      { "_id": "Resolved", "count": 45 }
    ]
  }
}
```

## 🚨 **Edge Cases Handled**

1. **Cross-Sector Similarity**: Different sectors never grouped
2. **Municipality Boundaries**: Groups don't cross municipality codes
3. **Time-based Grouping**: Only active complaints considered
4. **Priority Escalation**: Dynamic priority recalculation
5. **Image Evidence**: Representative images stored per group

## 🔄 **Future Enhancements**

1. **Machine Learning**: Train custom similarity models
2. **Time-based Clustering**: Consider temporal patterns
3. **Multi-language Support**: Handle regional languages
4. **Predictive Grouping**: Anticipate similar complaints
5. **Citizen Notifications**: Inform about existing similar issues

## 🛠️ **Implementation Notes**

- **Performance**: Geospatial indexing for fast location queries
- **Scalability**: Efficient for thousands of complaints
- **Reliability**: Graceful fallback if deduplication fails
- **Audit Trail**: Complete history of group operations
- **Data Integrity**: Consistent state across individual and group records

This system significantly improves municipal efficiency by ensuring that similar issues are handled together, reducing redundant work and improving response times for citizens.
