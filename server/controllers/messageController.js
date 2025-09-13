import cloudinary from "../lib/cloudinary.js"
import Message from "../models/message.js"
import User from "../models/User.js"
import { io, userSocketMap } from "../server.js"


//get all users except the logged in user
export const getUsersForSidebar = async (req, res) => {
    try {
        const userId = req.user._id  //logged-in user’s ID (set by your protectRoute middleware after JWT verification).
        const filteredUsers = await User.find({ _id: { $ne: userId } }).select("-password") //Finds all users except the logged-in user.

        //count number of messages not seen
        const unseenMessages = {}
        const promises = filteredUsers.map(async(user) => {
            const messages = await Message.find({senderId: user._id, receiverId: userId, seen: false})
            
            if(messages.length > 0){
                unseenMessages[user._id] = messages.length
            }
        })
        await Promise.all(promises) //ensures all message counts finish before sending response
        res.json({success: true, users: filteredUsers, unseenMessages})

    } catch (error) {
        console.log(error.message)
        res.json({success: false, message: error.message})
    }
}


//get all messages for selected user
export const getMessages = async (req, res) => {
    try {
        const { id: selectedUserId } = req.params  //ID of the user you clicked on in the sidebar
        const myId = req.user._id   //logged-in user’s ID (from middleware after JWT auth).

        //This finds all messages between me and the selected user.
        const messages = await Message.find({
            $or: [  //means either case is true:
                {senderId: myId, receiverId: selectedUserId},
                {senderId: selectedUserId, receiverId: myId}
            ]
        })

        //After fetching, we mark all messages from the other user as seen.
        await Message.updateMany(
            {senderId: selectedUserId,  //messages they sent.
             receiverId: myId}, //messages that I received
             {seen: true}
        )

        res.json({success: true, messages})


    } catch (error) {
        console.log(error.message)
        res.json({success: false, message: error.message})
    }
}

//api to mark message as seen using message id 
export const markMessageAsSeen = async(req, res) => {
    try {
        const { id } = req.params
        await Message.findByIdAndUpdate(id, {seen: true})
        res.json({success: true})
    } catch (error) {
        console.log(error.message)
        res.json({success: false, message: error.message})
    }
}


//send message to selected user
export const sendMessage = async (req, res) => {
    try {
        const {text, image} = req.body
        const receiverId = req.params.id
        const senderId = req.user._id
        
        let imageUrl
        if(image) {
            const uploadResponse = await cloudinary.uploader.upload(image)
            imageUrl = uploadResponse.secure_url
        }

        //it will store the data in the mongodb database
        const newMessage = await Message.create({
            senderId,
            receiverId,
            text,
            image: imageUrl
        })

        //Emit the new message to the receiver's socket
        const receiverSocketId = userSocketMap[receiverId]
        if(receiverSocketId) {
            io.to(receiverSocketId).emit("newMessage", newMessage)   //Send this only to the client that has this socket.id.
        }

        res.json({success: true, newMessage})


    } catch (error) {
        console.log(error.message)
        res.json({success: false, message: error.message})
    }
}




