import React, { useContext, useEffect, useState } from "react";
import assets from "../assets/assets";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import { ChatContext } from "../../context/chatContext";
import toast from "react-hot-toast";
import axios from "axios";

const Sidebar = () => {
  const {
    getUsers,
    getGroups,
    groups,
    users,
    selectedChat,
    setSelectedChat,
    unseenMessages,
    setUnseenMessages,
  } = useContext(ChatContext);

  const { logout, onlineUsers, token } = useContext(AuthContext);

  const [input, setInput] = useState("");

  const filteredUsers = input
    ? users.filter((user) =>
        user.fullName.toLowerCase().includes(input.toLowerCase())
      )
    : users;

  const navigate = useNavigate();

   const handleDeleteGroup = async (groupId, groupName) => {
    try {
      const authToken = token || localStorage.getItem("token");

      if (!authToken) {
        toast.error("You are not authenticated!");
        return;
      }

      if (!window.confirm(`Delete group "${groupName}"?`)) return;

      const { data } = await axios.delete(`/api/groups/${groupId}`, {
        headers: { token: authToken },
      });

      if (data.success) {
        toast.success("Group deleted");
        getGroups();
        setSelectedChat(null); // unselect group if deleted
      } else {
        toast.error(data.message || "Failed to delete group");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error deleting group");
    }
  };




  useEffect(() => {
    getUsers();
    getGroups();
  }, [onlineUsers]);

  return (
    <div
      className={`bg-[#8185B2]/10 h-full p-5 rounded-r-xl overflow-y-scroll text-white ${
        selectedChat ? "max-md:hidden" : ""
      }`}
    >
      {/* Top section with logo + menu */}
      <div className="pb-5">
        <div className="flex justify-between items-center">
          <img src={assets.logo} alt="logo" className="max-w-40" />

          {/* Hover Dropdown */}
          <div className="relative py-2 group">
            <img
              src={assets.menu_icon}
              alt="Menu"
              className="max-h-5 cursor-pointer"
            />

            {/* Dropdown menu */}
            <div className="absolute top-full right-0 z-20 w-32 p-3 rounded-md bg-[#282142] border border-gray-600 text-gray-100 hidden group-hover:block">
              <p
                onClick={() => navigate("/profile")}
                className="cursor-pointer text-sm hover:text-violet-300"
              >
                Profile
              </p>
              <hr className="my-2 border-t border-gray-500" />
              <p
                onClick={() => logout()}
                className="cursor-pointer text-sm hover:text-red-400"
              >
                Logout
              </p>
            </div>
          </div>
        </div>

        {/* Search bar */}
        <div className="bg-[#282142] rounded-full flex items-center gap-2 py-3 px-4 mt-5">
          <img src={assets.search_icon} alt="search" className="w-3" />
          <input
            onChange={(e) => setInput(e.target.value)}
            type="text"
            className="bg-transparent border-none outline-none text-white text-xs placeholder-[#c8c8c8] flex-1"
            placeholder="Search User..."
          />
        </div>
      </div>

      {/* Groups Section */}
      <div className="flex flex-col mt-4">
        {/* Header with + New */}
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-gray-400 text-sm">Groups</h3>
          <button
            onClick={() => navigate("/create-group")}
            className="text-lg text-violet-400 hover:underline"
          >
            + New
          </button>
        </div>

        {/* Group List */}
        {groups.map((group) => (
          <div
            key={group._id}
            onClick={() => setSelectedChat({ type: "group", data: group })}
            className={`relative group flex items-center gap-2 p-2 rounded cursor-pointer ${
              selectedChat?.type === "group" &&
              selectedChat.data._id === group._id
                ? "bg-[#282142]/50"
                : ""
            }`}
          >
            {/* Group Icon */}
            <img
              src={group.profilePic || assets.group_icon}
              alt="group"
              className="w-[35px] rounded-full"
            />

            {/* Group Name */}
            <p>{group.name}</p>

            {/* Cross Icon (only on hover) */}
            <img
              src={assets.cross_icon}
              alt="close"
              onClick={(e) => {
                e.stopPropagation(); //prevent selecting the group
                handleDeleteGroup(group._id, group.name)

              }}
              className="absolute top-1 right-1 w-5 h-5 rounded-full 
          opacity-0 group-hover:opacity-100 transition-opacity duration-200 
          cursor-pointer bg-black/50 p-1"
            />
          </div>
        ))}
      </div>

      {/* Users Section */}
      <div className="flex flex-col mt-4">
        <h3 className="text-gray-400 text-sm mb-2">Users</h3>
        {filteredUsers.map((user) => (
          <div
            key={user._id}
            onClick={() => {
              setSelectedChat({ type: "user", data: user });
              setUnseenMessages((prev) => ({ ...prev, [user._id]: 0 }));
            }}
            className={`relative group flex items-center gap-2 p-2 pl-4 rounded cursor-pointer max-sm:text-sm ${
              selectedChat?.type === "user" &&
              selectedChat.data._id === user._id
                ? "bg-[#282142]/50"
                : ""
            }`}
          >
            {/* Profile Pic */}
            <img
              src={user?.profilePic || assets.avatar_icon}
              alt="profile pic"
              className="w-[35px] aspect-square rounded-full"
            />

            {/* User Info */}
            <div className="flex flex-col leading-4">
              <p>{user.fullName}</p>
              {onlineUsers.includes(user._id) ? (
                <span className="text-green-400 text-xs">Online</span>
              ) : (
                <span className="text-neutral-400 text-xs">Offline</span>
              )}
            </div>

            {/* Unseen Messages Badge */}
            {unseenMessages[user._id] > 0 && (
              <p className="absolute top-2 right-2 text-xs h-5 w-5 flex justify-center items-center rounded-full bg-violet-500/50">
                {unseenMessages[user._id]}
              </p>
            )}

            {/* Cross Icon (appears only on hover) */}
            <img
              src={assets.cross_icon}
              alt="close"
              onClick={(e) => {
                e.stopPropagation();
                console.log("Exit/Delete user:",user._id );
                // call API to exit/delete user

              }}

              className="absolute top-1 right-1 w-5 h-5 rounded-full 
          opacity-0 group-hover:opacity-100 transition-opacity duration-200 
          cursor-pointer bg-black/50 p-1"
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default Sidebar;
