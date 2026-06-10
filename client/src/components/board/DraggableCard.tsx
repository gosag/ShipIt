import React, { useEffect, useRef, useState } from 'react';
import { useDraggable } from '@dnd-kit/core';
export interface DraggableCardProps {
  card: any;
  columnId: string;
  activeCardId?: string | null;
  workspaceId?: string | null;
  onClick: () => void;
  currentUserId?: string;
}
import {api} from '../../axios';
import socket from '../../../socket';
import { MessageSquare, X} from 'lucide-react';
export const DraggableCard: React.FC<DraggableCardProps> = ({ card, columnId, activeCardId, onClick, currentUserId, workspaceId }) => {
  const { attributes, listeners, setNodeRef: setDraggableNodeRef, transform, isDragging } = useDraggable({ id: card._id, data: { columnId, card } });
  const style = transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` } : undefined;

  const isAssignedToMe = currentUserId && card.assignees && card.assignees.includes(currentUserId);
  const [showMessages, setShowMessages] = useState(false);
  const [messageInput, setMessageInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const handleMessageClick = (e: React.MouseEvent | React.PointerEvent) => {
    e.stopPropagation();
    setShowMessages(true);
  };
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
 };
 let mssgInfo:{ content: string; author: { name: string; email: string } } | null = null;
  const messageSendHandler=async()=>{
    const res= await  api.post(`/api/messages/send-message/${card._id}`, { 
      content: messageInput,
      workspace: workspaceId,
      card: card._id,
    });
 
    if(res.status === 201){
      console.log(res.data)
      setMessages(prev => [...prev, res.data]);
      scrollToBottom()
      setMessageInput("");
      mssgInfo = { content: res.data.content, author: { name: res.data.author.name, email: res.data.author.email } };
      socket.emit("message-group", `card-${card._id}`, mssgInfo);
    } else {
      alert("Failed to send message.");
    }
  }

  const getMessagesHandler=async (cardId)=>{
    try{
      const res= await api.get(`/api/messages/get-messages/${cardId}`);
      if(res.status === 200){
        setMessages(res.data);
        socket.emit("message-group", `card-${cardId}`, `User has opened messages for card ${cardId}`);
      }

    }catch(err){
      console.error("Failed to fetch messages for card", cardId, err);
    }
}
useEffect(()=>{
  socket.on("groupMessageOnCard", (message)=>{
    console.log("Received group message on card:", message);
    if(typeof message === "string"){
      console.log("System message received, ignoring:", message);
      return;
    }
    console.log("Message info:", message);
    setMessages(prev => [...prev, message]);
    if(!showMessages){
      setUnreadCount(prev => prev + 1);
    }
    
    scrollToBottom();
  });
  return ()=>{
    socket.off("groupMessageOnCard");
  };
},[showMessages]);
useEffect(()=>{
  setCurrentUser(JSON.parse(localStorage.getItem("userData") || "{}"));},
[]);
useEffect(() => {
  if (showMessages) {
    scrollToBottom();
  }
}, [messages, showMessages]);
 const markCommentsAsRead = async () => {
  try {
    await api.patch(`/api/columns/${columnId}/cards/${card._id}/read`);
    console.log(`Marked comments as read for card ${card._id}`);
    setUnreadCount(0);
  } catch (error) {
    console.error("Failed to mark comments as read", error);
  }
};
const newMessagesCounter= async()=>{
  try{
    const res= await api.get(`/api/columns/${columnId}/cards/${card._id}/unread`);
    console.log("Unread messages count:", res.data.unreadCount);
    setUnreadCount(res.data.unreadCount);
  } catch (error) {
    console.error("Failed to fetch unread messages count", error);
  }
};
useEffect(()=>{
 newMessagesCounter();
},[]);
  return (
    <div
      ref={setDraggableNodeRef}
      onClick={onClick}
      style={style}
      {...listeners}
      {...attributes}
      className={`group bg-[#1C1C1E] border border-[#2C2C2E] hover:border-[#3A3A3C] hover:shadow-[0_0_0_1px_#2C2C2E] transition-all duration-150 rounded-xl p-3.5 cursor-grab active:cursor-grabbing ${
        isDragging || activeCardId === card._id ? "opacity-0" : ""
      }`}
    >
      {/* Header */}
      <div
        className="flex justify-between items-start gap-2"
        onClick={(e) => {
          handleMessageClick(e);
          getMessagesHandler(card._id);
          markCommentsAsRead();
        }}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <h4 className="text-[13.5px] font-medium text-gray-200 leading-snug flex-1">
          {card.title}
        </h4>

        <div className="relative shrink-0">
          <button
            className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-500 hover:text-gray-300 hover:bg-[#2C2C2E] transition-colors"
            aria-label="Open comments"
          >
            <MessageSquare size={15} />
          </button>
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-4 h-4 bg-red-500 text-white text-[10px] font-semibold px-1 rounded-full flex items-center justify-center leading-none">
              {unreadCount}
            </span>
          )}
        </div>
      </div>

      {/* Badges */}
      {(card.priority || isAssignedToMe) && (
        <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
          {card.priority && (
            <span
              className={`text-[11px] font-medium px-2 py-0.5 rounded-full uppercase tracking-wide ${
                card.priority === "urgent"
                  ? "bg-red-500/10 text-red-400"
                  : card.priority === "high"
                  ? "bg-amber-500/10 text-amber-400"
                  : card.priority === "medium"
                  ? "bg-blue-500/10 text-blue-400"
                  : "bg-zinc-500/10 text-zinc-500"
              }`}
            >
              {card.priority}
            </span>
          )}
          {isAssignedToMe && (
            <span className="text-[11px] font-medium px-2 py-0.5 rounded-full uppercase tracking-wide bg-violet-500/10 text-violet-400">
              For you
            </span>
          )}
        </div>
      )}

      {/* Comments Modal */}
      {showMessages && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={(e) => {
            e.stopPropagation();
            setShowMessages(false);
          }}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <div
            className="w-full max-w-105 bg-[#1C1C1E] rounded-2xl border border-[#3A3A3C] flex flex-col overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-4 py-3 border-b border-[#2C2C2E] flex items-center justify-between">
              <h3 className="text-[14px] font-medium text-gray-200 flex items-center gap-2">
                <MessageSquare size={15} className="text-gray-500" />
                Comments
              </h3>
              <button
                onClick={() => setShowMessages(false)}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-500 hover:text-gray-300 hover:bg-[#2C2C2E] transition-colors"
                aria-label="Close comments"
              >
                <X size={16} />
              </button>
            </div>

            {/* Messages List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 max-h-[55vh] min-h-50 custom-scrollbar">
              {messages.length > 0 ? (
                messages.map((msg: any) => (
                  <div key={msg._id} className="flex gap-2.5 items-start">
                    <div className="w-7 h-7 rounded-full bg-indigo-500/15 border border-indigo-500/20 flex items-center justify-center shrink-0 overflow-hidden">
                      {msg.author?.avatar ? (
                        <img
                          src={msg.author.avatar}
                          alt={msg.author.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-[11px] font-medium text-indigo-400">
                          {msg.author?.name
                            ?.split(" ")
                            .map((w: string) => w[0])
                            .join("")
                            .slice(0, 2) ?? "?"}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-col gap-1 max-w-[84%]">
                      <span className="text-[11.5px] text-gray-500 ml-0.5">
                        {currentUser?.email === msg.author?.email ? (
                          <span className="text-blue-400 font-medium">You</span>
                        ) : (
                          msg.author?.name
                        )}
                      </span>
                      <div className="bg-[#2C2C2E] border border-[#3A3A3C] rounded-2xl rounded-tl-sm px-3.5 py-2 text-[13.5px] text-gray-200 leading-relaxed">
                        {msg.content}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center py-12 gap-2 opacity-40">
                  <MessageSquare size={36} className="text-gray-500" />
                  <p className="text-[13px] text-gray-400 font-medium">No comments yet</p>
                  <p className="text-[12px] text-gray-500">Be the first to share your thoughts.</p>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Row */}
            <div className="p-3 border-t border-[#2C2C2E]">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Add a comment…"
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && messageInput.trim()) {
                      messageSendHandler();
                    }
                  }}
                  className="flex-1 h-9 bg-[#2C2C2E] px-4 rounded-full border border-[#3A3A3C] text-[13.5px] text-gray-200 placeholder:text-gray-600 focus:outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/30 transition-all"
                />
                <button
                  onClick={messageSendHandler}
                  disabled={!messageInput.trim()}
                  className="h-9 px-4 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-[13px] font-medium rounded-full transition-colors"
                >
                  Send
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
