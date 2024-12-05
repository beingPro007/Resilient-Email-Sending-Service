import mongoose, {Schema} from "mongoose";

const emailSchema = new Schema({
    to: {
        type: String,
        unique: false,
        required: true,
    },
    from: {
        type: String,
        unique: false,
        required: true
    },
    payload: {
        type: String,
        unique: false,
        required: true,
    },
    subject: {
        type: String,
        unique: false,
        required: false
    }
}, {timestamps: true})

const Email = mongoose.model("Email", emailSchema);

export default Email;