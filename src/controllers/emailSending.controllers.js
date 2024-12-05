import amqp from "amqplib";
import ApiError from "../utils/ApiError.js";
import { asynchandler } from "../utils/Asynchandler.js";
import { ApiResonse } from "../utils/ApiResponse.js";

const sendMail = asynchandler(async (req, res, _) => {
    try {
        // Establish connection with RabbitMQ
        const connect = await amqp.connect(`amqp://${process.env.amqpSend}/`);
        if (!connect) {
            throw new ApiError(400, "AMQP Connection error happened!!!");
        }

        // Create a channel
        const channel = await connect.createChannel();
        if (!channel) {
            throw new ApiError(400, "Channel Creation Error");
        }

        // Ensure the queue exists
        const assertion = await channel.assertQueue("emailQueue", { durable: true });
        if (!assertion) {
            throw new ApiError(400, "Queue Assertion Error!!!");
        }

        // Destructure and validate the request body
        const { to, from, payload, subject } = req.body;
        if ([to, payload, from].some((field) => !field?.trim())) {
            throw new ApiError(400, "to, from, and payload are required fields");
        }

        // Add email data to the queue
        const emailData = JSON.stringify({ to, from, subject, payload });
        console.log("Email Data", emailData);
        
        const dataQueued = channel.sendToQueue("emailQueue", Buffer.from(emailData), { persistent: false });

        // Return success response
        return res.status(200).json(new ApiResonse(200, `Payload added to queue: from ${from} to ${to}`, dataQueued));
    } catch (error) {
        console.log("Error in queuing the payload:", error);
        return res.status(500).json(new ApiError(500, "Failed to queue the email payload"));
    }
});

export { sendMail };
