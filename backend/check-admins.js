const mongoose = require('mongoose');
const User = require('./src/models/User');
require('dotenv').config();

const mongoUri = process.env.MONGODB_URI || "mongodb+srv://pranay:Pranay71@cluster0.bojsi2z.mongodb.net/?appName=Cluster0";

const checkAdmins = async () => {
    try {
        await mongoose.connect(mongoUri);
        console.log('Connected to MongoDB');

        const admins = await User.find({ role: 'admin' });
        console.log('Found admins:', admins.length);
        admins.forEach(admin => {
            console.log(`- ${admin.email}: municipalityCode = ${admin.municipalityCode}`);
        });

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

checkAdmins();
