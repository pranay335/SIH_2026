const ComplaintGroup = require('../models/ComplaintGroup');
const Complaint = require('../models/Complaint');
const User = require('../models/User');

/**
 * Validate that an employee can accept a new assignment.
 * Returns { valid: true, employee } or { valid: false, reason, code }.
 */
const validateEmployee = async (employeeId, currentGroupId = null) => {
    const employee = await User.findById(employeeId);

    if (!employee) {
        return { valid: false, reason: 'Employee not found', code: 404 };
    }

    if (employee.role !== 'employee') {
        return { valid: false, reason: 'User is not an employee', code: 400 };
    }

    if (employee.availabilityStatus === 'OFF_DUTY') {
        return { valid: false, reason: 'Employee is currently OFF_DUTY', code: 400 };
    }

    if (employee.availabilityStatus === 'ON_LEAVE') {
        return { valid: false, reason: 'Employee is currently ON_LEAVE', code: 400 };
    }

    if (employee.availabilityStatus === 'UNAVAILABLE') {
        return { valid: false, reason: 'Employee is UNAVAILABLE (at max capacity)', code: 400 };
    }

    if (employee.currentWorkload >= (employee.maxConcurrentComplaints || 5)) {
        return {
            valid: false,
            reason: `Employee is at max capacity (${employee.currentWorkload}/${employee.maxConcurrentComplaints || 5})`,
            code: 400
        };
    }

    // Check if already assigned to this group
    if (currentGroupId) {
        const group = await ComplaintGroup.findOne({ group_id: currentGroupId });
        if (group && group.assigned_to && group.assigned_to.toString() === employeeId.toString()) {
            return { valid: false, reason: 'Cannot reassign to the same employee', code: 400 };
        }
    }

    return { valid: true, employee };
};

/**
 * Reassign a complaint group to a new employee.
 * Handles workload increment/decrement for both old and new employee.
 */
const reassignComplaintGroup = async (groupId, newEmployeeId, notes = '') => {
    // 1. Fetch complaint group
    const group = await ComplaintGroup.findOne({ group_id: groupId });
    if (!group) {
        throw { status: 404, message: 'Complaint group not found' };
    }

    if (group.status === 'Closed') {
        throw { status: 400, message: 'Cannot reassign a closed complaint' };
    }

    // 2. Validate new employee
    const validation = await validateEmployee(newEmployeeId, groupId);
    if (!validation.valid) {
        throw { status: validation.code, message: validation.reason };
    }

    const newEmployee = validation.employee;

    // 3. Handle old employee workload (decrement) — use findByIdAndUpdate to skip full validation
    const oldEmployeeId = group.assigned_to;
    if (oldEmployeeId) {
        await User.findByIdAndUpdate(oldEmployeeId, [
            { $set: { currentWorkload: { $max: [0, { $add: [{ $ifNull: ['$currentWorkload', 0] }, -1] }] } } }
        ]);
        console.log(`📉 Workload decreased for old employee ${oldEmployeeId}`);
    }

    // 4. Increment new employee workload — use findByIdAndUpdate to skip full validation
    await User.findByIdAndUpdate(newEmployeeId, {
        $inc: { currentWorkload: 1 }
    });
    console.log(`📈 Workload increased for ${newEmployee.name}`);

    // 5. Update complaint group
    group.assigned_to = newEmployeeId;
    group.status = 'Assigned';
    group.reopened = false;
    group.feedbackStatus = 'PENDING';
    if (notes) group.notes = notes;
    group.last_updated = new Date();
    await group.save();

    // 6. Sync individual complaints in the group
    await Complaint.updateMany(
        { group_id: group._id },
        { assigned_to: newEmployeeId, status: 'Assigned' }
    );

    // Return populated group
    const updatedGroup = await ComplaintGroup.findOne({ group_id: groupId })
        .populate('assigned_to', 'name email phone department currentWorkload maxConcurrentComplaints availabilityStatus')
        .populate('affected_users', 'name email');

    return { success: true, group: updatedGroup };
};

module.exports = { validateEmployee, reassignComplaintGroup };
