import React, { useContext, useEffect, useRef, useState } from "react";
import assets from "../assets/assets";
import { formatMessageTime } from "../lib/utils";
import { ChatContext } from "../context/ChatContext";
import { AuthContext } from "../context/AuthContext";
import toast from "react-hot-toast";

const ChatContainer = () => {
  const { messages, selectedChat, setSelectedChat, sendMessage, getMessages, setCall } =
    useContext(ChatContext);
  const { authUser, onlineUsers , socket } = useContext(AuthContext);

  const scrollEnd = useRef();
  const [input, setInput] = useState("");
  const [showSidebar, setShowSidebar] = useState(false);

  const chatId = selectedChat?.data?._id;
  const chatMessages = chatId ? messages[chatId] || [] : [];

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || !chatId) return;

    await sendMessage({
      text: input.trim(),
      receiverId: chatId,
      type: selectedChat.type,
    });
    setInput("");
  };

  const handleSendImage = async (e) => {
    if (!chatId) return;
    const file = e.target.files[0];
    if (!file?.type.startsWith("image/")) {
      toast.error("Select a valid image file");
      return;
    }
    const reader = new FileReader();
    reader.onloadend = async () => {
      await sendMessage({
        image: reader.result,
        receiverId: chatId,
        type: selectedChat.type,
      });
      e.target.value = "";
    };
    reader.readAsDataURL(file);
  };

  const handleStartCall = (targetId) => {
    if(!targetId) return
    // socket.emit("call-user", { targetId , offer: null})
    setCall({ type: "outgoing", targetId})
    toast.success("Calling...")
  }

  useEffect(() => {
    if (chatId) getMessages(chatId, selectedChat.type);
  }, [selectedChat]);

  useEffect(() => {
    if (scrollEnd.current)
      scrollEnd.current.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  if (!selectedChat) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 text-gray-500 bg-white/10 max-md:hidden">
        <img src={assets.logo_icon} className="max-w-16" alt="logo" />
        <p className="text-lg font-medium text-white">Chat anytime, anywhere</p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-scroll relative backdrop-blur-lg">
     
      <div className="flex items-center gap-3 py-3 mx-4 border-b border-stone-500">
        <img
          src={selectedChat.data.profilePic || assets.avatar_icon}
          alt=""
          className="w-8 h-8 rounded-full"
        />
        <p className="flex-1 text-lg text-white flex items-center gap-2">
          {selectedChat.type === "user"
            ? selectedChat.data.fullName
            : selectedChat.data.name}
          {selectedChat.type === "user" &&
            onlineUsers.includes(selectedChat.data._id) && (
              <span className="w-2 h-2 rounded-full bg-green-500"></span>
            )}
        </p>

        {selectedChat.type === "user" && (
          <img src= {assets.videoCall_icon} alt="" className="w-6 h-6 cursor-pointer"
            onClick={() => handleStartCall(selectedChat.data._id)}
          />
        )}

        <img
            src={assets.menu_icon}
            alt="menu"
            onClick={() => setShowSidebar(true)}
            className="w-6 h-6 cursor-pointer md:hidden"
          />
      </div>



    
      <div className="flex flex-col h-[calc(100%-120px)] overflow-y-scroll p-3 pb-6">
        {chatMessages.map((msg, index) => {
          if (!msg) return null;
          const senderId = msg.senderId || msg.sender?._id;
          const isMine = senderId === authUser?._id;
          console.log("ok", isMine);
          return (
            <div
              key={index}
              className={`flex items-end gap-2 mb-4 ${
                isMine ? "justify-end" : "justify-start"
              }`}
            >
              {!isMine && (
                <img
                  src={
                    msg.sender?.profilePic ||
                    selectedChat.data?.profilePic ||
                    assets.avatar_icon
                  }
                  alt=""
                  className="w-7 h-7 rounded-full"
                />
              )}
              <div className="max-w-[230px]">
                {msg.image ? (
                  <img
                    src={msg.image}
                    alt="media"
                    className="w-full border border-gray-700 rounded-lg overflow-hidden"
                  />
                ) : (
                  <p
                    className={`p-2 md:text-sm font-light rounded-lg break-words text-white ${
                      isMine
                        ? "bg-violet-500/30 rounded-br-none"
                        : "bg-gray-600/40 rounded-bl-none"
                    }`}
                  >
                    {msg.text}
                  </p>
                )}
                <p className="text-gray-500 text-[11px] mt-1 text-right">
                  {formatMessageTime(msg.createdAt)}
                </p>
              </div>
              {isMine && (
                <img
                  src={authUser?.profilePic || assets.avatar_icon}
                  alt=""
                  className="w-7 h-7 rounded-full"
                />
              )}
            </div>
          );
        })}
        <div ref={scrollEnd}></div>
      </div>

     
      <form
        onSubmit={handleSendMessage}
        className="absolute bottom-0 left-0 right-0 flex items-center gap-3 p-3"
      >
        <div className="flex-1 flex items-center bg-gray-100/12 px-3 rounded-full">
          <input
            onChange={(e) => setInput(e.target.value)}
            value={input}
            type="text"
            placeholder="Send a message"
            className="flex-1 text-sm p-3 border-none rounded-lg outline-none text-white placeholder-gray-400"
          />
          <input
            onChange={handleSendImage}
            type="file"
            id="image"
            accept="image/png, image/jpeg"
            hidden
          />
          <label htmlFor="image">
            <img
              src={assets.gallery_icon}
              alt="upload"
              className="w-5 mr-2 cursor-pointer"
            />
          </label>
        </div>
        <button type="submit">
          <img
            src={assets.send_button}
            alt="send"
            className="w-7 cursor-pointer"
          />
        </button>
      </form>
    </div>
  );
};

export default ChatContainer;
