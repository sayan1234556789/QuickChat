import mongoose from "mongoose";

const groupSchema = new mongoose.Schema({
  name: { type: String, required: true },
 members: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  admin: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, 
  profilePic: { type: String, default: "" },
  messages: [
    {
      sender: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      text: String,
      createdAt: { type: Date, default: Date.now },
      image: { type: String },
      seen: { type: Boolean, default: false }
    },
  ],
}, { timestamps: true });

const Group = mongoose.model("Group", groupSchema);

export default Group;
