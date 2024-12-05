import mongoose from "mongoose";
import { DB_NAME } from "../../constants.js"


const connectDB = async () => {
    try {
        const mongoDBconnection = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
        console.log(`🚀🚀 MongoDB connected successfully with DB Host: ${mongoDBconnection.connection.host}`);
    } catch (error) {
        console.error("Failed to connect to MongoDB:", error.message);

        if (process.env.NODE_ENV === "development") {
            process.exit(1);
        } else {
            console.error("Retrying connection...");
            setTimeout(connectDB, 5000);
        }
    }
};

export default connectDB