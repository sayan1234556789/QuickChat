import express from "express"
import { protectRoute } from "../middleware/auth.js"
import { 
    createGroup, 
    getMyGroups, 
    sendGroupMessage, 
    getGroupMessages, 
    exitGroup, 
    deleteGroup, 
    updateGroup,
    getGroupMembers
} from "../controllers/groupController.js"


const groupRouter = express.Router()

groupRouter.post("/" , protectRoute, createGroup)
groupRouter.get("/", protectRoute, getMyGroups)
groupRouter.post("/:id/message", protectRoute, sendGroupMessage)
groupRouter.get("/:id/messages", protectRoute, getGroupMessages)
groupRouter.put("/:id/exit", protectRoute, exitGroup)
groupRouter.delete("/:id", protectRoute,deleteGroup)
groupRouter.put("/:id", protectRoute, updateGroup)
groupRouter.get("/:id/members", protectRoute, getGroupMembers)

export default groupRouter