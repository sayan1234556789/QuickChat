import express from "express"
import "dotenv/config.js"
import cors from "cors"
import http from "http"
import { connectDB } from "./lib/db.js"
import userRouter from "./routes/userRoutes.js"
import messageRouter from "./routes/messageRoutes.js"
import { Server } from "socket.io"
import groupRouter from "./routes/groupRoute.js"



const app = express()
const server = http.createServer(app)

//Initialize socket.io server instance (io) attached to your HTTP server.
export const io = new Server(server, {
    cors: { origin: "*"} //allows any client (frontend) from any domain to connect.
})

//store online users 
export const userSocketMap = {}  //{userId : socketId}

//socket.io connection handler
io.on("connection", (socket) => {   //Runs whenever a new client (browser/app) connects.
    const userId = socket.handshake.query.userId //gets the userId that frontend sends while connecting.
    console.log("User Connected", userId)

    if(userId) userSocketMap[userId] = socket.id;  //Stores the mapping of {userId : socketId}

    //Emit online users to all connected clients
    io.emit("getOnlineUsers", Object.keys(userSocketMap))

    // When a user disconnects
    socket.on("disconnect", ()=> {
        console.log("User Disconnected", userId)
        delete userSocketMap[userId]
        io.emit("getOnlineUsers", Object.keys(userSocketMap)) //Broadcasts updated list of online users to everyone.
    })
})


//socket.io group connection handler
io.on("connection", (socket) => {
  console.log("User Connected ", socket.id)

  //join group room
  socket.on("joinGroup", (groupId) => {
    socket.join(groupId)
    console.log(`User joined group: ${groupId}`)
  })

  socket.on("leaveGroup", (groupId) => {
    socket.leave(groupId)
    console.log(`User left group: ${groupId}`)
  })

})

//video call signaling
  io.on("connection" , (socket) =>{
    console.log("Video Call : User connected for signaling", socket.id)

  
    socket.on("call-user", ({ targetId, offer }) => {
    const targetSocketId = userSocketMap[targetId];   //map userId → socketId
    if (targetSocketId) {
      console.log(`Call initiated from ${socket.id} to user ${targetId}`);
      io.to(targetSocketId).emit("incoming-call", { from: socket.handshake.query.userId, offer });
    }
  });

    //callee accepts and sends an answer
    socket.on("answer-call", ({ targetId, answer }) => {
    const targetSocketId = userSocketMap[targetId];
    if (targetSocketId) {
      console.log(`Call answered by ${socket.id} to user ${targetId}`);
      io.to(targetSocketId).emit("call-accepted", { from: socket.handshake.query.userId, answer });
    }
  });

    //Exchange ICE candidates between peers
    socket.on("ice-candidate", ({ targetId, candidate }) => {
    const targetSocketId = userSocketMap[targetId];
    if (targetSocketId) {
      io.to(targetSocketId).emit("ice-candidate", { from: socket.handshake.query.userId, candidate });
    }
  });


    //end call
    socket.on("end-call", ({ targetId }) => {
    const targetSocketId = userSocketMap[targetId];
    if (targetSocketId) {
      io.to(targetSocketId).emit("call-ended", { from: socket.handshake.query.userId });
    }
  });

  })


// middlewares
app.use(express.json({ limit: "4mb" }))
app.use(cors())

// routes
app.use("/api/status", (req, res) => res.send("Server is live"))
app.use("/api/auth", userRouter)
app.use("/api/messages", messageRouter)
app.use("/api/groups", groupRouter)

// main function to connect DB and start server
const startServer = async () => {
  try {
    await connectDB()
    const PORT = process.env.PORT || 5000
    server.listen(PORT, () =>
      console.log("Server is running on PORT : " + PORT)
    )
  } catch (error) {
    console.error("Error starting server:", error.message)
    process.exit(1)
  }
}

startServer()