const path = require('path');
const connectDB = require(path.join(__dirname, '..', 'src', 'config', 'database'));
const mongoose = require('mongoose');

connectDB().then(async () => {
    // First, update ALL employees to max 5
    const result = await mongoose.connection.db.collection('users').updateMany(
        { role: 'employee' },
        { $set: { maxConcurrentComplaints: 5 } }
    );
    console.log('Updated', result.modifiedCount, 'employees to maxConcurrentComplaints: 5');

    // Then, mark employees with workload >= 5 as UNAVAILABLE
    const overloaded = await mongoose.connection.db.collection('users').updateMany(
        { role: 'employee', currentWorkload: { $gte: 5 } },
        { $set: { availabilityStatus: 'UNAVAILABLE' } }
    );
    console.log('Marked', overloaded.modifiedCount, 'overloaded employees as UNAVAILABLE');

    // Verify
    const employees = await mongoose.connection.db.collection('users').find(
        { role: 'employee' },
        { projection: { name: 1, currentWorkload: 1, maxConcurrentComplaints: 1, availabilityStatus: 1 } }
    ).toArray();
    console.log('\nAll employees after update:');
    employees.forEach(e => {
        console.log(`  ${e.name}: workload=${e.currentWorkload}/${e.maxConcurrentComplaints}, status=${e.availabilityStatus}`);
    });

    process.exit(0);
}).catch(err => {
    console.error(err);
    process.exit(1);
});
