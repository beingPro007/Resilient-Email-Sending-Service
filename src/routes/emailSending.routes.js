import { Router } from "express";
import { sendMail } from "../controllers/emailSending.controllers.js";

const router = Router();

router.route('/send-email').post(sendMail);

export default router;