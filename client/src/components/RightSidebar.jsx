import React, { useContext, useEffect, useState } from "react";
import assets from "../assets/assets";
import { ChatContext } from "../context/chatContext";
import { AuthContext } from "../context/AuthContext";
import toast from "react-hot-toast";
import axios from "axios";

const RightSidebar = () => {
  const { selectedChat, messages, getGroups, setSelectedChat } = useContext(ChatContext);
  const { logout, onlineUsers, token } = useContext(AuthContext);

  const [isEditing, setIsEditing] = useState(false);
  const [newName, setNewName] = useState("");
  const [newImage, setNewImage] = useState(null);
  const [members, setMembers] = useState([]);

  if (!selectedChat) return null;

  const chatMessages = messages[selectedChat.data._id] || [];

  const msgImages = chatMessages
    .filter((msg) => msg.image)
    .map((msg) => msg.image);

  // Fetch group members
  useEffect(() => {
    if (selectedChat.type === "group" && token) {
      const fetchMembers = async () => {
        try {
          const { data } = await axios.get(
            `/api/groups/${selectedChat.data._id}/members`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          if (data.success) setMembers(data.members);
          else toast.error(data.message || "Failed to fetch members");
        } catch (e) {
          toast.error("Error fetching group members");
          console.error(e);
        }
      };
      fetchMembers();
    } else {
      setMembers([]);
    }
  }, [selectedChat, token]);

  // Exit group
  const handleExitGroup = async () => {
    try {
      const { data } = await axios.put(
        `/api/groups/${selectedChat.data._id}/exit`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (data.success) {
        toast.success("You exited the group");
        getGroups();
        setSelectedChat(null);
      } else {
        toast.error(data.message || "Failed to exit group");
      }
    } catch (e) {
      toast.error("Error exiting group");
      console.error(e);
    }
  };

  // Update group
  const handleUpdateGroup = async () => {
    try {
      const formData = {};
      if (newName) formData.name = newName;
      if (newImage) formData.image = newImage;

      const { data } = await axios.put(
        `/api/groups/${selectedChat.data._id}`,
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (data.success) {
        toast.success("Group updated successfully");
        getGroups();
        setSelectedChat({ ...selectedChat, data: data.group });
        setIsEditing(false);
        setNewName("");
        setNewImage(null);
      } else {
        toast.error(data.message || "Failed to update group");
      }
    } catch (e) {
      toast.error("Error updating group");
      console.error(e);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setNewImage(reader.result);
    reader.readAsDataURL(file);
  };

  return (
    <div className="bg-[#8185B2]/10 text-white min-w-[280px] h-full flex flex-col overflow-y-auto relative p-4">
      {/* User / Group Info */}
      <div className="flex flex-col items-center gap-2 mb-4">
        <img
          src={selectedChat.data.profilePic || assets.avatar_icon}
          alt=""
          className="w-20 aspect-square rounded-full"
        />
        {selectedChat.type === "group" && (
          <img
            src={assets.edit}
            alt=""
            className="w-5 h-5 absolute top-27 right-20 cursor-pointer"
            onClick={() => setIsEditing(true)}
          />
        )}
        <h1 className="text-xl font-medium flex items-center gap-2">
          {selectedChat.type === "group"
            ? selectedChat.data.name
            : selectedChat.data.fullName}
          {selectedChat.type === "user" &&
            onlineUsers.includes(selectedChat.data._id) && (
              <span className="w-2 h-2 rounded-full bg-green-500"></span>
            )}
        </h1>
        <p className="text-sm text-center">{selectedChat.data.bio}</p>
      </div>

      {/* Edit modal */}
      {isEditing && (
        <div className="bg-[#1e1e2f] p-4 rounded-lg shadow-lg absolute top-20 left-1/2 -translate-x-1/2 w-72 z-50">
          <h2 className="text-lg font-medium mb-2 font-sans">Edit Group</h2>
          <input
            type="text"
            placeholder="New group name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="w-full p-2 rounded mb-2 text-white"
          />
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="mb-5"
          />
          {newImage && (
            <img
              src={newImage}
              alt="preview"
              className="w-16 h-16 rounded-full mb-2 border-2 border-white"
            />
          )}
          <div className="flex justify-end gap-2">
            <button
              className="bg-gray-500 px-3 py-1 rounded"
              onClick={() => setIsEditing(false)}
            >
              Cancel
            </button>
            <button
              className="bg-violet-600 px-3 py-1 rounded"
              onClick={handleUpdateGroup}
            >
              Save
            </button>
          </div>
        </div>
      )}

      <hr className="border-[#ffffff50] my-4 w-full" />

      {/* Media Section */}
      <div className="text-xs mb-4">
        <p className="mb-2">Media</p>
        <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
          {msgImages.map((url, index) => (
            <div
              key={index}
              onClick={() => window.open(url)}
              className="cursor-pointer rounded"
            >
              <img src={url} alt="" className="w-full rounded-md" />
            </div>
          ))}
          {msgImages.length === 0 && <p className="text-gray-400">No media</p>}
        </div>
      </div>

      {/* Members Section */}
      {selectedChat.type === "group" && (
        <div className="text-xs mb-4">
          <p className="mb-2 font-medium">Members ({members.length})</p>
          <div className="flex flex-col gap-2 max-h-48 overflow-y-auto">
            {members.map((member) => (
              <div key={member._id} className="flex items-center gap-2">
                <img
                  src={member.profilePic || assets.avatar_icon}
                  alt=""
                  className="w-6 h-6 rounded-full"
                />
                <span>{member.fullName}</span>
              </div>
            ))}
            {members.length === 0 && <p className="text-gray-400">No members</p>}
          </div>
        </div>
      )}

      {/* Exit group button */}
      {selectedChat.type === "group" && (
        <button
          onClick={handleExitGroup}
          className="bg-red-500 text-white text-sm font-light py-2 px-6 rounded-full w-full mb-2"
        >
          Exit Group
        </button>
      )}

      {/* Logout Button */}
      <button
        onClick={() => logout()}
        className="bg-gradient-to-r from-purple-400 to-violet-600 text-white text-sm font-light py-2 px-6 rounded-full w-full mt-auto"
      >
        Logout
      </button>
    </div>
  );
};

export default RightSidebar;
