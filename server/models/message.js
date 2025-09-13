import mongoose from "mongoose";

//In Mongoose, a Schema is like a blueprint for how documents (records) in a MongoDB collection should look.
const messageSchema = new mongoose.Schema({
    senderId : {type: mongoose.Schema.Types.ObjectId, ref: "User", required: true},
    receiverId : {type: mongoose.Schema.Types.ObjectId, ref: "User", required: true},
    text: {type: String},
    image: {type: String},
    seen: {type: Boolean , default: false}

}, {timestamps: true});

//creating a user
const Message = mongoose.model("Message", messageSchema);

export default Message;