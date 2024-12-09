import amqp from "amqplib";
import ApiError from "../utils/ApiError.js";
import { asynchandler } from "../utils/Asynchandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";

// Utility function to implement retry logic
const retry = async (fn, retries = 5, delay = 2000) => {
    let lastError;
    for (let i = 0; i < retries; i++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error;
            console.log(`Error in executing the function, retrying in ${delay}ms...`);
            await new Promise((resolve) => setTimeout(resolve, delay));
            delay *= 2;
        }
    }
    throw lastError;
};

const sendMail = asynchandler(async (req, res, _) => {
    let channel, connect;
    try {
        // Establish connection with RabbitMQ
        connect = await retry(() => amqp.connect(`amqp://${process.env.amqpSend}/`), 5, 1000);
        if (!connect) {
            throw new ApiError(400, "AMQP Connection error occurred!!!");
        }

        // Create a channel
        channel = await retry(() => connect.createChannel(), 3, 2000);
        if (!channel) {
            throw new ApiError(400, "Channel Creation Error");
        }

        // Ensure queue exists or create it
        const assertion = await retry(() => channel.assertQueue("emailQueue", { durable: true }), 4, 1000);
        if (!assertion) {
            throw new ApiError(400, "Queue Assertion Error!!!");
        }

        // Destructure and validate the request body
        const { to, from, payload, subject } = req.body;
        if (!to || !from || !payload || (typeof to !== 'string') || (typeof from !== 'string') || (typeof payload !== 'string')) {
            throw new ApiError(400, "to, from, and payload must be non-empty strings");
        }

        // Add email to queue
        const emailData = JSON.stringify({ to, from, subject, payload });
        console.log("Email Data", emailData);

        const dataQueued = channel.sendToQueue("emailQueue", Buffer.from(emailData), { persistent: true });

        // Success response
        return res.status(200).json(new ApiResponse(200, `Payload added to queue: from ${from} to ${to}`, dataQueued));
    } catch (error) {
        console.log("Error in queuing the payload:", error);
        return res.status(500).json(new ApiError(500, error.message || "Failed to queue the email payload"));
    } finally {
        if (channel) await channel.close().catch((err) => console.error("Channel close error:", err));
        if (connect) await connect.close().catch((err) => console.error("Connection close error:", err));
    }
});

export { sendMail };
