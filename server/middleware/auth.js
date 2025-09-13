import User from "../models/User.js"
import jwt from "jsonwebtoken"

//Middleware to protect the route
export const protectRoute = async (req, res, next) => {
    try {
        const token = req.headers.token  

        //it will decode the token 
        const decoded = jwt.verify(token, process.env.JWT_SECRET)

        const user = await User.findById(decoded.userId).select("-password") // delete the password

        if(!user) {
            return res.json({ success: false, message: "User not found" })
        }

        //if found
        req.user = user   //attaching the logged-in user’s data to the request object.
        next() // to run the userController

    } catch (error) {
        console.log(error.message)
        res.json({success: false, message: error.message})
    }
}