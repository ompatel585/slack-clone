import mongoose from 'mongoose';
import { ENV } from './env.js';

export const connectDB = async() => {
    try {
        const conn = await mongoose.connect(ENV.MONGO_URI );
        console.log("MongoDB connected successfully!",conn.connection.host);
    } catch (error) {
        console.log("Error connecting to the database ", error);
        process.exit(1); //status code 1 indicates error , 0 means success
    }
    
} 
