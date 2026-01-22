import { createContext, useContext, useEffect, useState } from "react";
import { AuthContext } from "./AuthContext";
import toast from "react-hot-toast";

export const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
  const [messages, setMessages] = useState({});
  const [users, setUsers] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [unseenMessages, setUnseenMessages] = useState({});
  const [groups, setGroups] = useState([]);
  const [call, setCall] = useState(null)

  const { socket, axios, token, authUser } = useContext(AuthContext);

  // Normalize message
  const normalizeMessage = (msg, type) => {
    const senderId =
      msg.senderId ||
      (msg.sender && (msg.sender._id || msg.sender.id)) || 
      msg.userId || 
      "unknown_sender";

    return {
      _id: msg._id || Date.now(),
      senderId,
      text: msg.text || "",
      image: msg.image || null,
      createdAt: msg.createdAt || new Date().toISOString(),
      groupId:
        type === "group"
          ? msg.groupId || msg.receiverId || "unknown_group"
          : null,
      sender: msg.sender || null,
    };
  };

 
  const getUsers = async () => {
    try {
      const { data } = await axios.get("/api/messages/users");
      if (data.success) {
        setUsers(data.users);
        setUnseenMessages(data.unseenMessages || {});
      }
    } catch (error) {
      toast.error(error.message);
    }
  };


  const getMessages = async (chatId, type) => {
    try {
      if (!chatId) return;
      const url =
        type === "group"
          ? `/api/groups/${chatId}/messages`
          : `/api/messages/${chatId}`;
      const { data } = await axios.get(url);
      if (data.success) {
        const normalized = (data.messages || []).map((m) =>
          normalizeMessage(m, type)
        );
        setMessages((prev) => ({ ...prev, [chatId]: normalized }));
      }
    } catch (error) {
      toast.error(error.message);
    }
  };


  const sendMessage = async (messageData) => {
    if (!messageData?.receiverId) return;
    try {
      const url =
        messageData.type === "group"
          ? `/api/groups/${messageData.receiverId}/message`
          : `/api/messages/send/${messageData.receiverId}`;
      const { data } = await axios.post(url, messageData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (data.success) {
        const key = messageData.receiverId;
        const normalized = {
          ...normalizeMessage(data.newMessage, messageData.type),
          senderId: authUser._id, 
        };
        setMessages((prev) => ({
          ...prev,
          [key]: prev[key] ? [...prev[key], normalized] : [normalized],
        }));
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
    }
  };

  
  const handleIncomingMessage = (msg, type) => {
    if (!msg) return;

    const normalized = normalizeMessage(msg, type);
    const key = type === "group" ? normalized.groupId : normalized.senderId;
    if (!key) return;

   
    setMessages((prev) => ({
      ...prev,
      [key]: prev[key] ? [...prev[key], normalized] : [normalized],
    }));

    
    if (type === "user" && normalized._id) {
      axios.put(`/api/messages/mark/${normalized._id}`).catch(() => {});
    }

    
    if (!selectedChat || selectedChat.data?._id !== key) {
      setUnseenMessages((prev) => ({
        ...prev,
        [key]: prev[key] ? prev[key] + 1 : 1,
      }));
    }
  };

  const subscribeToMessages = () => {
    if (!socket) return;

    socket.on("newMessage", (msg) => handleIncomingMessage(msg, "user"));
    socket.on("newGroupMessage", (msg) => handleIncomingMessage(msg, "group"));

    socket.on("incoming-call" , ({ from , offer}) => {
      setCall({ type: "incoming", from, offer})
    })

    socket.on("call-accepted", ({ from, answer }) =>{
      setCall({ type: "accepted", from, answer })
    })

    socket.on("ice-candidate", ({ from, candidate }) => {
      document.dispatchEvent(
        new CustomEvent("incoming-ice", { detail: { from, candidate }})
      )
    })

    socket.on("call-ended", ({ from }) => {
      setCall(null)
      toast("Call ended")
    })
  };

  const unsubscribeFromMessages = () => {
    if (socket) {
      socket.off("newMessage");
      socket.off("newGroupMessage");
    }
  };

  const getGroups = async () => {
    try {
      const { data } = await axios.get("/api/groups", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (data.success) setGroups(data.groups);
    } catch (error) {
      toast.error(error.message);
    }
  };

  useEffect(() => {
    subscribeToMessages();
    return () => unsubscribeFromMessages();
  }, [socket, selectedChat]);

  return (
    <ChatContext.Provider
      value={{
        messages,
        users,
        groups,
        selectedChat,
        getUsers,
        getGroups,
        getMessages,
        sendMessage,
        setSelectedChat,
        unseenMessages,
        setUnseenMessages,
        call,
        setCall,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};
