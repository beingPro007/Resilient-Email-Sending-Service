import amqp from "amqplib";
import ApiError from "../utils/ApiError.js";
import { asynchandler } from "../utils/Asynchandler.js";
import { ApiResonse } from "../utils/ApiResponse.js";

//Utility function to implement the retry logic 
const retry = async (fn, retries = 5, delay = 2000) => {
    let lastError;
    for (i = 0; i < retries; i++) {
        delay = Math.pow(2, i) *100
        try {
            return await fn();
        } catch (error) {
            lastError = error;
            console.log(`Error in executing the function retrying in ${delay}...`);
            await new Promise((resolve) => setTimeout(resolve, delay))
        }
    }
    throw lastError;
}
const sendMail = asynchandler(async (req, res, _) => {
    let channel, connect
    try {
        // Establish connection with RabbitMQ
        connect = await retry(() => amqp.connect(`amqp://${process.env.amqpSend}/`), retries = 5, delay = 1000)
        if (!connect) {
            throw new ApiError(400, "AMQP Connection error happened!!!");
        }

        // channel creation
        channel = await retry (() => connect.createChannel(), 3, 2000);
        if (!channel) {
            throw new ApiError(400, "Channel Creation Error");
        }

        // ensure that queue exists if not it will crate one
        const assertion = await retry(channel.assertQueue("emailQueue", { durable: true }), 4, 1000);
        if (!assertion) {
            throw new ApiError(400, "Queue Assertion Error!!!");
        }

        // Destructuring and get the values from the body
        const { to, from, payload, subject } = req.body;
        if ([to, payload, from].some((field) => !field?.trim())) {
            throw new ApiError(400, "to, from, and payload are required fields");
        }

        // adding email to queue
        const emailData = JSON.stringify({ to, from, subject, payload });
        console.log("Email Data", emailData);

        const dataQueued = channel.sendToQueue("emailQueue", Buffer.from(emailData), { persistent: true });

        //Success response returned
        return res.status(200).json(new ApiResonse(200, `Payload added to queue: from ${from} to ${to}`, dataQueued));
    } catch (error) {
        console.log("Error in queuing the payload:", error);
        return res.status(500).json(new ApiError(500, "Failed to queue the email payload"));
    } finally {
        if (channel) await channel.close();
        if (connect) await connect.close();
    }
});

export { sendMail };
