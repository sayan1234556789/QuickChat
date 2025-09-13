import { createContext, useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { io } from "socket.io-client";

const backendUrl = import.meta.env.VITE_BACKEND_URL;
axios.defaults.baseURL = backendUrl; //so axios always calls your backend

export const AuthContext = createContext(); //hold auth-related data and functions

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem("token") || null);
  const [authUser, setAuthUser] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [socket, setSocket] = useState(null);

  //check if user is authenticated and if so,  set the user data and connect the socket

  const checkAuth = async () => {
    try {
      const { data } = await axios.get("/api/auth/check"); //to verify if the user is still logged in.
      if (data.success) {
        setAuthUser(data.user); //Saves the user’s info in authUser.
        connectSocket(data.user); //establish a socket.io connection for real-time features
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  // Login function to handle user authentication and socket connection
  const login = async (state, credentials) => {
    try {
      const { data } = await axios.post(`/api/auth/${state}`, credentials); //API Call
      if (data.success) {
        setAuthUser(data.userData); // Store user details in React state/context
        connectSocket(data.userData); // Open a real-time socket connection
        axios.defaults.headers.common["token"] = data.token; // Attach token to every request
        setToken(data.token); // Save token in app state
        localStorage.setItem("token", data.token);
        toast.success(data.message); // Show success popup/notification
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  //logout function to handle user logout and socket disconnection
  const logout = async () => {
    localStorage.removeItem("token");
    setToken(null);
    setAuthUser(null);
    setOnlineUsers([]);
    axios.defaults.headers.common["token"] = null;
    toast.success("logged out successfully");
    socket.disconnect();
  };

  //Update profile function to handle user profile updates
  const updateProfile = async (body) => {
    try {
      const { data } = await axios.put("/api/auth/update-profile", body);

      if (data.success) {
        setAuthUser(data.user);
        toast.success("Profile updated successfully");
      } else {
        toast.error(data.message || "Profile update failed");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
    }
  };

  //connect socket function to handle socket connection and online users updates
  const connectSocket = (userData) => {
    if (!userData || socket?.connected) return; //if a socket is already connected, it exits early to avoid duplicate connections.
    const newSocket = io(backendUrl, {
      query: {
        userId: userData._id,
      },
    });
    newSocket.connect(); //Explicitly connects the socket.
    setSocket(newSocket); //Saves this socket instance in React state (socket) so that the rest of your app can use it.

    newSocket.on("getOnlineUsers", (userIds) => {
      setOnlineUsers(userIds);
    });
  };

  useEffect(() => {
  if (token) {
    axios.defaults.headers.common["token"] = token;
    checkAuth()
  } else {
    delete axios.defaults.headers.common["token"];
  }
}, [token]);

  const value = {
    axios,
    authUser,
    onlineUsers,
    socket,
    login,
    logout,
    updateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
