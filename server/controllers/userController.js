import { generateToken } from "../lib/utils.js"
import User from "../models/User.js"
import bcrypt from "bcryptjs"
import cloudinary from "../lib/cloudinary.js"

//signup a new user
export const signup = async (req, res) =>{
    const {fullName, email, password, bio} = req.body

    try {
        //if none of the item is available
        if(!fullName || !email || !password || !bio) {
            return res.json({success: false, message: "Missing Details"})
        }
        //else find the email of the user is available or not

        const user = await User.findOne({email})

        if(user){ //if user is available
           return res.json({success: false, message: "Account already exists"}) 
        }

        //Generates a random cryptographic salt.
        /*A salt is extra random data added to the password before hashing, making each hash unique even if two users have the same password.
        The number 10 is the cost factor (also called rounds).
        Higher number = more secure but slower hashing.
        10 is a good balance for most apps.*/

        const salt = await bcrypt.genSalt(10)
        const hashedPassword = await bcrypt.hash(password, salt) //Takes the user’s password + the generated salt, then runs it through bcrypt’s hashing algorithm.

        const newUser = await User.create({
            fullName, email, password: hashedPassword, bio
        })

        const token = generateToken(newUser._id)

        res.json({success: true, userData: newUser, token, message: "Account created successfully"})

    } catch (error) {
        console.log(error.message)
        res.json({success: false, message: error.message})
    }
}

//Controller to login  a user
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const userData = await User.findOne({ email });

    if (!userData) {
      return res.json({ success: false, message: "User not found" });
    }

    const isPasswordCorrect = await bcrypt.compare(password, userData.password);

    if (!isPasswordCorrect) {
      return res.json({ success: false, message: "Invalid credentials" });
    }

    const token = generateToken(userData._id);

    res.json({
      success: true,
      message: "Login successful",
      userData,
      token,
    });
  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
  }
};


//controller to check if user is authenticated
export const checkAuth = (req, res) => {
    res.json({success: true, user: req.user}) //return the user data when user is authenticated
}

//controller to update user profile details
export const updateProfile = async (req, res) => {
  try {
    const { profilePic, bio, fullName } = req.body;
    const userId = req.user._id;

    console.log("Incoming update request:", {
      hasProfilePic: !!profilePic,           //The !! is a double NOT operator that converts a value into a strict boolean (true or false).
      bio,
      fullName,
    });

    let updatedUser;

    if (!profilePic) {
      // Update bio and name only
      updatedUser = await User.findByIdAndUpdate(
        userId,
        { bio, fullName },
        { new: true }
      );
    } else {
      try {
        console.log("Uploading image to Cloudinary...");
        const upload = await cloudinary.uploader.upload(profilePic, {
          folder: "user_profiles", // optional
          resource_type: "auto", 
        });
        console.log("Cloudinary upload success:", upload.secure_url);

        updatedUser = await User.findByIdAndUpdate(
          userId,
          { profilePic: upload.secure_url, bio, fullName },
          { new: true }
        );
      } catch (uploadErr) {
        console.error("Cloudinary upload failed:", uploadErr);
        return res.json({
          success: false,
          message: "Image upload failed",
          error: uploadErr.message,
        });
      }
    }

    res.json({ success: true, user: updatedUser });
  } catch (e) {
    console.error("updateProfile failed:", e);
    res.json({ success: false, message: e.message });
  }
};



