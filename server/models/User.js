import mongoose from "mongoose";

//In Mongoose, a Schema is like a blueprint for how documents (records) in a MongoDB collection should look.
const userSchema = new mongoose.Schema({
    email: {type: String , required: true, unique: true},
    fullName: {type: String , required: true},
    password: {type: String , required: true, minlength: 6},
    profilePic: {type: String , default: ""},
    bio: {type: String}
}, {timestamps: true});

//creating a user
const User = mongoose.model("User", userSchema);

export default User;