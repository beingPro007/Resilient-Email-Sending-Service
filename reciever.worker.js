import mongoose from "mongoose";
import amqp from "amqplib";
import Email from "./src/models/email.models.js";
import dotenv from "dotenv";
import connectDB from "./src/db/index.js";

const waitForMongooseConnection = async () => {
    while (mongoose.connection.readyState !== 1) {
        console.log("Waiting for MongoDB connection...");
        await new Promise((resolve) => setTimeout(resolve, 1000));
    }
    console.log("MongoDB connection is ready.");
};

const connectRabbitMQ = async (retries = 5) => {
    while (retries > 0) {
        try {
            const connection = await amqp.connect(`amqp://${process.env.amqpSend}/`);
            return connection;
        } catch (error) {
            console.error("RabbitMQ connection failed. Retrying...",error);
            retries -= 1;
            await new Promise((resolve) => setTimeout(resolve, 2000));
        }
    }
    throw new Error("Failed to connect to RabbitMQ after retries.");
};

const receiver = async () => {
    try {
        await waitForMongooseConnection();

        const connection = await connectRabbitMQ();
        const channel = await connection.createChannel();
        const assertion = await channel.assertQueue("emailQueue", { durable: true });

        console.log(" [*] Waiting for messages in %s. To exit press CTRL+C", "emailQueue");

        channel.prefetch(1);
        channel.consume("emailQueue", async (message) => {
            if (message) {
                try {
                    const emailData = JSON.parse(message.content.toString());
                    console.log("Email Data Received:", emailData);

                    const loggedData = await Email.create({
                        to: emailData.to,
                        from: emailData.from,
                        payload: emailData.payload,
                        subject: emailData.subject,
                    });

                    console.log("Data successfully logged to the database:", loggedData);
                    channel.ack(message);
                } catch (err) {
                    console.error("Error processing message:", err.message);
                    channel.nack(message, false, false);
                }
            }
        });

        process.on("SIGINT", async () => {
            console.log("Shutting down...");
            await channel.close();
            await connection.close();
            if (mongoose.connection.readyState === 1) {
                await mongoose.disconnect();
                console.log("MongoDB disconnected.");
            }
            process.exit(0);
        });
    } catch (error) {
        console.error("Error in initializing the receiver:", error.message);
        process.exit(1);
    }
};

dotenv.config({ path: "./.env" });
connectDB().catch((error) => {
    console.log("Error fetching the database or error in connecting for this reasons", error);
});

receiver().catch((error) => {
    console.error("Error in initializing the receiver:", error.message);
});
