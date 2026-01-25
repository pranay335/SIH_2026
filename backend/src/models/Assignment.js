const mongoose = require('mongoose');

const assignmentSchema = new mongoose.Schema({
  complaint_id: {
    type: String,
    required: true,
    ref: 'Complaint'
  },
  employee_id: {
    type: String,
    required: true,
    ref: 'User'
  },
  municipalityCode: {
    type: String,
    required: true,
    default: 'BMC'
  },
  sector: {
    type: String,
    required: true
  },
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High'],
    default: 'Medium'
  },
  status: {
    type: String,
    enum: ['Assigned', 'In Progress', 'Completed', 'Rejected'],
    default: 'Assigned'
  },
  assignedAt: {
    type: Date,
    default: Date.now
  },
  completedAt: {
    type: Date
  },
  notes: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Assignment', assignmentSchema);
