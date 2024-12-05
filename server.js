import connectDB from './src/db/index.js';
import dotenv from "dotenv";
import ApiError from './src/utils/ApiError.js';
import app from './app.js';

dotenv.config({
    path: './.env'
})

app.on('error', (error) => {
    throw new ApiError(500, "Error in connecting to the DB!!!", error)
});
app.listen(process.env.PORT || 3002, () => {
    console.log(`Server running on Port ${process.env.PORT}`);
})