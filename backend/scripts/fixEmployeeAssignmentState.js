const path = require('path');
const mongoose = require('mongoose');
const connectDB = require(path.join(__dirname, '..', 'src', 'config', 'database'));

const normalizeDepartment = (department = '') => {
  const value = department.toString().trim().toLowerCase();

  if (value.includes('road')) return 'Roads';
  if (value.includes('water')) return 'Water';
  if (value.includes('waste') || value.includes('garbage')) return 'Waste';
  if (value.includes('electric')) return 'Electricity';
  if (value.includes('health') || value.includes('medical')) return 'Health';
  if (value.includes('drain') || value.includes('sewer')) return 'Drainage';
  return 'General';
};

const getWorkloadByEmployee = async (db) => {
  const rows = await db.collection('complaints').aggregate([
    {
      $match: {
        assigned_to: { $ne: null },
        status: { $nin: ['Resolved', 'Closed'] }
      }
    },
    {
      $group: {
        _id: '$assigned_to',
        activeCount: { $sum: 1 }
      }
    }
  ]).toArray();

  return new Map(rows.map((row) => [String(row._id), row.activeCount]));
};

const run = async () => {
  await connectDB();
  const db = mongoose.connection.db;

  const workloadMap = await getWorkloadByEmployee(db);
  const employees = await db.collection('users').find({ role: 'employee' }).toArray();

  let updated = 0;
  for (const employee of employees) {
    const normalizedDepartment = normalizeDepartment(employee.department || 'General');
    const maxConcurrentComplaints = Math.max(1, Number(employee.maxConcurrentComplaints) || 5);
    const currentWorkload = workloadMap.get(String(employee._id)) || 0;

    let availabilityStatus = (employee.availabilityStatus || 'AVAILABLE').toUpperCase();
    if (!['OFF_DUTY', 'ON_LEAVE'].includes(availabilityStatus)) {
      availabilityStatus = currentWorkload >= maxConcurrentComplaints ? 'UNAVAILABLE' : 'AVAILABLE';
    }

    const needsUpdate =
      employee.department !== normalizedDepartment ||
      employee.currentWorkload !== currentWorkload ||
      employee.maxConcurrentComplaints !== maxConcurrentComplaints ||
      employee.availabilityStatus !== availabilityStatus;

    if (!needsUpdate) continue;

    await db.collection('users').updateOne(
      { _id: employee._id },
      {
        $set: {
          department: normalizedDepartment,
          currentWorkload,
          maxConcurrentComplaints,
          availabilityStatus
        }
      }
    );

    updated += 1;
    console.log(
      `Updated ${employee.email}: department=${normalizedDepartment}, workload=${currentWorkload}/${maxConcurrentComplaints}, status=${availabilityStatus}`
    );
  }

  console.log(`Done. Updated ${updated} employee records.`);
  process.exit(0);
};

run().catch((err) => {
  console.error('Fix failed:', err);
  process.exit(1);
});
