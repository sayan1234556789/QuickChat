import React, { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import assets from "../assets/assets";
import { AuthContext } from "../../context/AuthContext";

const ProfilePage = () => {
  const { authUser, updateProfile } = useContext(AuthContext);

  const [selectedImg, setSelectedImg] = useState(null);
  const [name, setName] = useState(authUser.fullName);
  const [bio, setBio] = useState(authUser.bio);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedImg) {
      await updateProfile({ fullName: name, bio });
      navigate("/");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64Image = reader.result;

      await updateProfile({
        profilePic: base64Image,
        fullName: name,
        bio,
      });

      navigate("/");
    };

    reader.readAsDataURL(selectedImg);
  };

  return (
    <div className="min-h-screen bg-cover bg-center flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-2xl border border-gray-600 bg-black/40 backdrop-blur-lg text-gray-300 rounded-lg flex flex-col sm:flex-row items-center justify-between gap-8 p-6 shadow-xl">
        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-5 flex-1 w-full"
        >
          <h3 className="text-lg sm:text-xl font-semibold">Profile details</h3>
          <label
            htmlFor="avatar"
            className="flex items-center gap-3 cursor-pointer text-sm sm:text-base"
          >
            <input
              onChange={(e) => setSelectedImg(e.target.files[0])}
              type="file"
              id="avatar"
              accept=".png, .jpg, .jpeg"
              hidden
            />
            <img
              src={
                selectedImg
                  ? URL.createObjectURL(selectedImg)
                  : assets.avatar_icon
              }
              alt=""
              className={`w-12 h-12 object-cover rounded-full`}
            />
            Upload profile image
          </label>
          <input
            type="text"
            required
            placeholder="Your Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="p-2 border border-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-violet-500"
          />

          <textarea
            onChange={(e) => setBio(e.target.value)}
            value={bio}
            placeholder="Write profile bio"
            required
            className="p-2 border border-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-violet-500"
            rows={4}
          ></textarea>
          <button
            type="submit"
            className="bg-gradient-to-r from-purple-500 to-violet-600 text-white p-2 rounded-full text-lg cursor-pointer shadow-md hover:shadow-xl transition"
          >
            Save
          </button>
        </form>
        <img
          className="w-28 h-28 sm:w-36 sm:h-36 object-cover rounded-full border border-gray-500"
          src={authUser?.profilePic || assets.logo_icon}
          alt=""
        />
      </div>
    </div>
  );
};

export default ProfilePage;
