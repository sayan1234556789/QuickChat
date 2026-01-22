import React, { useContext, useState, useEffect } from "react";
import { ChatContext } from "../context/ChatContext";
import { AuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

const CreateGroup = () => {
  const { users, getUsers, getGroups } = useContext(ChatContext);
  const { axios, token } = useContext(AuthContext);

  const [groupName, setGroupName] = useState("");
  const [selectedMembers, setSelectedMembers] = useState([]);
  const navigate = useNavigate();

  // Fetch users to display in the members list
  useEffect(() => {
    getUsers();
  }, []);

  //if member is already in group then filter or show all the prev message
  const handleToggleMember = (userId) => {
    setSelectedMembers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    if (!groupName.trim()) {
      return toast.error("Group name is required");
    }
    if (selectedMembers.length === 0) {
      return toast.error("Select at least one member");
    }

    try {
      const { data } = await axios.post(
        "/api/groups",
        { name: groupName, members: selectedMembers },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (data.success) {
        toast.success("Group created successfully!");
        getGroups(); // refresh groups in sidebar
        navigate("/"); // go back to homepage
      } else {
        toast.error(data.message);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message);
    }
  };

  return (
    <div className="h-screen flex items-center justify-center bg-[#1E1E2E] text-white">
      <form
        onSubmit={handleCreateGroup}
        className="bg-[#2A2A3C] p-6 rounded-xl w-full max-w-md shadow-lg"
      >
        <h2 className="text-xl font-semibold mb-4 text-center">
          Create New Group
        </h2>

       
        <input
          type="text"
          placeholder="Group Name"
          value={groupName}
          onChange={(e) => setGroupName(e.target.value)}
          className="w-full mb-4 p-2 rounded-md bg-[#3A3A4E] outline-none border border-gray-600"
        />

     
        <div className="max-h-60 overflow-y-auto mb-4">
          {users.map((user) => (
            <label
              key={user._id}
              className="flex items-center gap-2 p-2 cursor-pointer hover:bg-[#3A3A4E] rounded-md"
            >
              <input
                type="checkbox"
                checked={selectedMembers.includes(user._id)}
                onChange={() => handleToggleMember(user._id)}
              />
              <img
                src={user.profilePic || "/default-avatar.png"}
                alt="profile"
                className="w-7 h-7 rounded-full"
              />
              <span>{user.fullName}</span>
            </label>
          ))}
        </div>

     
        <button
          type="submit"
          className="w-full bg-violet-600 hover:bg-violet-700 transition text-white py-2 rounded-lg"
        >
          Create Group
        </button>

        <button
          type="button"
          onClick={() => navigate("/")}
          className="w-full mt-2 text-sm text-gray-400 hover:underline"
        >
          Cancel
        </button>
      </form>
    </div>
  );
};

export default CreateGroup;
