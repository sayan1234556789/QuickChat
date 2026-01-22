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


export const io = new Server(server, {
    cors: { origin: "*"}
})


export const userSocketMap = {}  


io.on("connection", (socket) => {   
    const userId = socket.handshake.query.userId 
    console.log("User Connected", userId)

    if(userId) userSocketMap[userId] = socket.id; 

    
    io.emit("getOnlineUsers", Object.keys(userSocketMap))

   
    socket.on("disconnect", ()=> {
        console.log("User Disconnected", userId)
        delete userSocketMap[userId]
        io.emit("getOnlineUsers", Object.keys(userSocketMap)) 
    })
})



io.on("connection", (socket) => {
  console.log("User Connected ", socket.id)

 
  socket.on("joinGroup", (groupId) => {
    socket.join(groupId)
    console.log(`User joined group: ${groupId}`)
  })

  socket.on("leaveGroup", (groupId) => {
    socket.leave(groupId)
    console.log(`User left group: ${groupId}`)
  })

})


  io.on("connection" , (socket) =>{
    console.log("Video Call : User connected for signaling", socket.id)

  
    socket.on("call-user", ({ targetId, offer }) => {
    const targetSocketId = userSocketMap[targetId];  
    if (targetSocketId) {
      console.log(`Call initiated from ${socket.id} to user ${targetId}`);
      io.to(targetSocketId).emit("incoming-call", { from: socket.handshake.query.userId, offer });
    }
  });

    
    socket.on("answer-call", ({ targetId, answer }) => {
    const targetSocketId = userSocketMap[targetId];
    if (targetSocketId) {
      console.log(`Call answered by ${socket.id} to user ${targetId}`);
      io.to(targetSocketId).emit("call-accepted", { from: socket.handshake.query.userId, answer });
    }
  });

    
    socket.on("ice-candidate", ({ targetId, candidate }) => {
    const targetSocketId = userSocketMap[targetId];
    if (targetSocketId) {
      io.to(targetSocketId).emit("ice-candidate", { from: socket.handshake.query.userId, candidate });
    }
  });


  
    socket.on("end-call", ({ targetId }) => {
    const targetSocketId = userSocketMap[targetId];
    if (targetSocketId) {
      io.to(targetSocketId).emit("call-ended", { from: socket.handshake.query.userId });
    }
  });

  })



app.use(express.json({ limit: "4mb" }))
app.use(cors())


app.use("/api/status", (req, res) => res.send("Server is live"))
app.use("/api/auth", userRouter)
app.use("/api/messages", messageRouter)
app.use("/api/groups", groupRouter)


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