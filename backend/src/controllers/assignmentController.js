const Assignment = require('../models/Assignment');
const User = require('../models/User');
const Complaint = require('../models/Complaint');

// @desc    Auto-assign complaint to best employee
// @route   POST /api/assignments/auto-assign
// @access  Private
const autoAssignComplaint = async (req, res) => {
  try {
    const { complaint_id, sector, municipalityCode, priority } = req.body;

    // Find available employees for this sector and municipality
    const employees = await User.find({
      role: 'employee',
      department: sector,
      municipalityCode: municipalityCode,
      availabilityStatus: 'AVAILABLE'
    }).populate('employeeId');

    if (employees.length === 0) {
      return res.status(404).json({ 
        message: 'No available employees found for this sector and municipality' 
      });
    }

    // Calculate current workload for each employee
    const employeesWithWorkload = await Promise.all(
      employees.map(async (employee) => {
        const currentAssignments = await Assignment.countDocuments({
          employee_id: employee._id,
          status: { $in: ['Assigned', 'In Progress'] }
        });
        
        return {
          employee,
          currentWorkload: currentAssignments
        };
      })
    );

    // Sort by workload (ascending) and pick the employee with least workload
    employeesWithWorkload.sort((a, b) => a.currentWorkload - b.currentWorkload);
    const bestEmployee = employeesWithWorkload[0].employee;

    // Create assignment
    const assignment = new Assignment({
      complaint_id,
      employee_id: bestEmployee._id,
      municipalityCode,
      sector,
      priority,
      status: 'Assigned'
    });

    const savedAssignment = await assignment.save();

    // Update complaint with assigned employee
    await Complaint.findByIdAndUpdate(
      complaint_id,
      { assigned_to: bestEmployee._id, status: 'Assigned' },
      { new: true }
    );

    // Update employee workload
    await User.findByIdAndUpdate(
      bestEmployee._id,
      { $inc: { currentWorkload: 1 } }
    );

    res.status(201).json({
      message: 'Complaint assigned successfully',
      assignment: savedAssignment,
      assignedEmployee: {
        id: bestEmployee._id,
        name: bestEmployee.name,
        email: bestEmployee.email,
        employeeId: bestEmployee.employeeId
      }
    });

  } catch (error) {
    console.error('Auto-assignment error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get assignments for employee
// @route   GET /api/assignments/employee/:employeeId
// @access  Private
const getEmployeeAssignments = async (req, res) => {
  try {
    const { employeeId } = req.params;
    
    const assignments = await Assignment.find({ employee_id: employeeId })
      .populate('complaint_id')
      .sort({ assignedAt: -1 });

    res.json(assignments);
  } catch (error) {
    console.error('Get employee assignments error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update assignment status
// @route   PUT /api/assignments/:id
// @access  Private
const updateAssignmentStatus = async (req, res) => {
  try {
    const { status, notes } = req.body;
    const assignmentId = req.params.id;

    const assignment = await Assignment.findByIdAndUpdate(
      assignmentId,
      { 
        status,
        notes,
        ...(status === 'Completed' && { completedAt: new Date() })
      },
      { new: true }
    ).populate('complaint_id employee_id');

    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    // Update complaint status
    await Complaint.findByIdAndUpdate(
      assignment.complaint_id._id,
      { status: status === 'Completed' ? 'Resolved' : status },
      { new: true }
    );

    // Update employee workload if completed
    if (status === 'Completed') {
      await User.findByIdAndUpdate(
        assignment.employee_id._id,
        { $inc: { currentWorkload: -1 } }
      );
    }

    res.json({
      message: 'Assignment updated successfully',
      assignment
    });

  } catch (error) {
    console.error('Update assignment error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all assignments (admin)
// @route   GET /api/assignments
// @access  Private (Admin)
const getAllAssignments = async (req, res) => {
  try {
    const assignments = await Assignment.find({})
      .populate('complaint_id')
      .populate('employee_id', 'name email employeeId')
      .sort({ assignedAt: -1 });

    res.json(assignments);
  } catch (error) {
    console.error('Get all assignments error:', error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  autoAssignComplaint,
  getEmployeeAssignments,
  updateAssignmentStatus,
  getAllAssignments
};
