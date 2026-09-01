 const fs = require('fs');
 const path = require('path');
 const dotenv = require('dotenv');
 const mongoose = require('mongoose');
 
 const loadEnv = () => {
   const envPath = path.resolve(__dirname, '..', '..', '.env');
 
   dotenv.config({ path: envPath });
 
   if (process.env.MONGODB_URI || process.env.MONGO_URI) return;
   if (!fs.existsSync(envPath)) return;
 
   const buf = fs.readFileSync(envPath);
   const text = buf.includes(0) ? buf.toString('utf16le') : buf.toString('utf8');
 
   for (const rawLine of text.split(/\r?\n/)) {
     const line = rawLine.trim();
     if (!line || line.startsWith('#')) continue;
     const eq = line.indexOf('=');
     if (eq <= 0) continue;
 
     const key = line.slice(0, eq).trim();
     let value = line.slice(eq + 1).trim();
     if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
       value = value.slice(1, -1);
     }
 
     if (!process.env[key]) {
       process.env[key] = value;
     }
   }
 };
 
 const connectDB = async () => {
   try {
     loadEnv();
 
     const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
     if (!mongoUri) {
       throw new Error('MONGODB_URI is missing in .env');
     }
 
     const conn = await mongoose.connect(mongoUri, {
       serverSelectionTimeoutMS: 10000,
       maxPoolSize: 10,
     });
 
     console.log('MongoDB Connected Successfully');
     console.log(`Host: ${conn.connection.host}`);
     console.log(`DB: ${conn.connection.name}`);
   } catch (error) {
     console.error('MongoDB Connection Failed');
     console.error(`Error: ${error.message}`);
     process.exit(1);
   }
 };
 
 module.exports = connectDB;
