import express from 'express';
const app = express();

app.use(express.json());

import emailSending from "./src/routes/emailSending.routes.js"

app.get("/api/v1/", (req, res) => {
    console.log("Go to page /api/v1/email");
    res.send("Redirect to /api/v1/email");
});

app.use("/api/v1/email", emailSending);

export default app;