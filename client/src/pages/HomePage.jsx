import React, { useContext } from "react";
import Sidebar from "../components/Sidebar";
import ChatContainer from "../components/ChatContainer";
import RightSidebar from "../components/RightSidebar";
import { ChatContext } from "../context/chatContext";

const HomePage = () => {
  const { selectedChat } = useContext(ChatContext);

  return (
    <div className="w-full h-screen px-2 py-2 sm:px-[10%] sm:py-[3%]">
      <div
        className={`h-full rounded-2xl overflow-hidden grid backdrop-blur-xl bg-black/30 border border-gray-600 shadow-xl
          ${selectedChat 
            ? "grid-cols-1 md:grid-cols-[1fr_2fr_1fr]" 
            : "grid-cols-1 md:grid-cols-[1fr_2fr]"} 
        `}
      >
        <Sidebar />
        <ChatContainer />
        {selectedChat && <RightSidebar />}
      </div>
    </div>
  );
};

export default HomePage;
