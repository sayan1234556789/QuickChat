import Group from "../models/group.js";   // make sure filename matches
import { io } from "../server.js";
import Message from "../models/message.js";
import cloudinary from "../lib/cloudinary.js";
import messageRouter from "../routes/messageRoutes.js";


// Create a new group
export const createGroup = async (req, res) => {
  try {
    const { name, members } = req.body;
    const adminId = req.user?._id;  // logged-in user is admin

    if (!name || !members || members.length === 0) {
      return res.json({ success: false, message: "Missing group details" });
    }

    // add creator as member too (if not already in list)
    if (!members.includes(adminId.toString())) {
      members.push(adminId);
    }

    const group = await Group.create({
      name,
      members,
      admin: adminId,   //  set admin here
    });

    res.json({ success: true, group });
  } catch (e) {
    console.error(e.message);
    res.json({ success: false, message: e.message });
  }
};



// Get groups that logged-in user belongs to
export const getMyGroups = async (req, res) => {
  try {
    const userId = req.user._id;
    const groups = await Group.find({ members: userId })
      .populate("members", "-password")
      .sort({ createdAt: -1 });

    res.json({ success: true, groups });
  } catch (err) {
    console.error(err.message);
    res.json({ success: false, message: err.message });
  }
};


// Send a message in group
export const sendGroupMessage = async (req, res) => {
  try {
    const { text, image } = req.body;
    const { id: groupId } = req.params;
    const senderId = req.user._id;

    const group = await Group.findById(groupId);
    if (!group) {
      return res.json({ success: false, message: "Group not found" });
    }

    let imageUrl;
    if (image) {
      const uploadResponse = await cloudinary.uploader.upload(image);
      imageUrl = uploadResponse.secure_url;
    }

    const newMessage = {
      sender: senderId,
      text,
      image: imageUrl,
      createdAt: new Date(),
    };

    // Instead of pushing + saving full group, just update messages array
    await Group.findByIdAndUpdate(groupId, {
      $push: { messages: newMessage },
    });

    // Emit to all sockets in this group room
    io.to(groupId).emit("newGroupMessage", {
      groupId,
      senderId: senderId.toString(),
      text,
      image: imageUrl,
      createdAt: newMessage.createdAt,
      seen: false,
    });

    res.json({ success: true, newMessage });
  } catch (e) {
    console.error(e.message);
    res.json({ success: false, message: e.message });
  }
};



// Get all messages of a group
export const getGroupMessages = async (req, res) => {
  try {
    const { id: groupId } = req.params;

    const group = await Group.findById(groupId)
      .populate("messages.sender", "-password");

    if (!group) {
      return res.json({ success: false, message: "Group not found" });
    }

    res.json({ success: true, messages: group.messages });
  } catch (e) {
    console.error(e.message);
    res.json({ success: false, message: e.message });
  }
};


// Exit group (remove self from the group)
export const exitGroup = async (req, res) => {
  try {
    const { id: groupId } = req.params;
    const userId = req.user._id;

    const group = await Group.findByIdAndUpdate(
      groupId,
      { $pull: { members: userId } },
      { new: true }
    );

    if (!group) {
      return res.json({ success: false, message: "Group not found" });
    }

    return res.json({ success: true, message: "Exited group", group });
  } catch (e) {
    console.error(e.message);
    res.json({ success: false, message: e.message });
  }
};


// Delete the group (admin only)
export const deleteGroup = async (req, res) => {
  try {
    const { id: groupId } = req.params;
    const userId = req.user._id;

    const group = await Group.findById(groupId);
    if (!group) {
      return res.json({ success: false, message: "Group not found" });
    }

    if(!group.admin){
      return res.json({ success: false, message: "Group admin not set" })
    }

    // only admin can delete
    if (group.admin.toString() !== userId.toString()) {
      return res.json({ success: false, message: "Not authorized" });
    }

    await group.deleteOne();
    res.json({ success: true, message: "Group deleted" });
  } catch (e) {
    console.error(e.message);
    res.json({ success: false, message: e.message });
  }
};


// Update group info (name, pic)
export const updateGroup = async (req, res) => {
  try {
    const { id: groupId } = req.params;
    const { name, image } = req.body;
    const userId = req.user._id;

    const group = await Group.findById(groupId);
    if (!group) {
      return res.json({ success: false, message: "Group not found" });
    }

    //  only admin can update group details
    if (group.admin.toString() !== userId.toString()) {
      return res.json({ success: false, message: "Not authorized" });
    }

    let imageUrl;
    if (image) {
      const uploadResponse = await cloudinary.uploader.upload(image);
      imageUrl = uploadResponse.secure_url;
    }

    if (name) group.name = name;
    if (imageUrl) group.profilePic = imageUrl;

    await group.save();

    res.json({ success: true, group });
  } catch (e) {
    console.error(e.message);
    res.json({ success: false, message: e.message });
  }
};


// Get group members
export const getGroupMembers = async (req, res) => {
  try {
    const { id: groupId } = req.params;

    const group = await Group.findById(groupId)
      .populate("members", "fullName email profilePic")
      // .lean();

    if (!group) {
      return res.json({ success: false, message: "Group not found" });
    }

    res.json({ success: true, members: group.members });
  } catch (e) {
    console.error(e.message);
    res.json({ success: false, message: e.message });
  }
};
