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

import { api } from '../../axios';
import { MessageSquare , User, X} from 'lucide-react';
export const DraggableCard: React.FC<DraggableCardProps> = ({ card, columnId, activeCardId, onClick, currentUserId, workspaceId }) => {
  const { attributes, listeners, setNodeRef: setDraggableNodeRef, transform, isDragging } = useDraggable({ id: card._id, data: { columnId, card } });
  const style = transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` } : undefined;

  const isAssignedToMe = currentUserId && card.assignees && card.assignees.includes(currentUserId);
  const [showMessages, setShowMessages] = useState(false);
  const [messageInput, setMessageInput] = useState("");
  const [messages, setMessages] = useState([]);
  const handleMessageClick = (e: React.MouseEvent | React.PointerEvent) => {
    e.stopPropagation();
    setShowMessages(true);
  };
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
 };
 
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
    } else {
      alert("Failed to send message.");
    }
  }
  const getMessagesHandler=async (cardId)=>{
    try{
      const res= await api.get(`/api/messages/get-messages/${cardId}`);
      if(res.status === 200){
        console.log("Messages for card", cardId, res.data);
        setMessages(res.data.reverse());
        console.log(res.data)
      }
    }catch(err){
      console.error("Failed to fetch messages for card", cardId, err);
    }
}
let currentUser: any = null;
useEffect(()=>{
  currentUser = JSON.parse(localStorage.getItem("userData") || "{}");},
[]);
useEffect(() => {
  if (showMessages) {
    scrollToBottom();
  }
}, [messages, showMessages]);

  return (
    <div
      ref={setDraggableNodeRef}
      onClick={onClick}
      style={style}
      {...listeners}
      {...attributes}
      className={`bg-[#1C1C1E] border border-[#2C2C2E] hover:border-[#3C3C3E] transition-colors rounded-lg p-3 shadow-sm cursor-grab active:cursor-grabbing ${isDragging || activeCardId === card._id ? 'opacity-0' : ''}`}
    >
      <div className='flex justify-between items-start'>
       <h4 className="text-gray-200 font-medium text-sm">{card.title}</h4> 
        <button 
          onClick={(e)=>{
             handleMessageClick(e);
             getMessagesHandler(card._id);
          }}
           
          onPointerDown={(e) => e.stopPropagation()}
          className="p-1 rounded hover:bg-[#2C2C2E] transition-colors"
        >
          <MessageSquare size={16} />
        </button>
      </div>
      
      {card.description && (
        <p className="text-gray-400 text-xs mt-1 line-clamp-2">{card.description}</p>
      )}
      {(card.priority || isAssignedToMe) && (
        <div className="mt-3 flex  items-center gap-2">
          {card.priority && (
            <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${
              card.priority === 'urgent' ? 'bg-red-500/10 text-red-500' : 
              card.priority === 'high' ? 'bg-amber-500/10 text-amber-500' :
              card.priority === 'medium' ? 'bg-blue-500/10 text-blue-500' :
              'bg-slate-500/10 text-slate-400'
            }`}>
              {card.priority}
            </span>
          )}
          {isAssignedToMe && (
            <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400">
              For you
            </span>
          )}
        </div>
      )}
        {showMessages && (
          <div 
            onClick={(e) => {
              e.stopPropagation();
              setShowMessages(false);
            }}
            onPointerDown={(e) => e.stopPropagation()}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-100 flex items-center justify-center p-4"
          >
            <div 
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-[#1C1C1E] rounded-xl shadow-2xl border border-[#3C3C3E] flex flex-col overflow-hidden"
            >
              <div className="px-4 py-3 border-b border-[#3C3C3E] bg-[#2C2C2E]/50 flex justify-between items-center">
                <h3 className="font-semibold text-gray-200 flex items-center gap-2">
                  <MessageSquare size={16} className="text-blue-400" />
                  Comments
                </h3>
                <button 
                  onClick={() => setShowMessages(false)}
                  className="p-1.5 rounded-md text-gray-400 hover:text-gray-200 hover:bg-[#3C3C3E] transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              <div  className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4 max-h-[60vh] min-h-75">
                {messages.length > 0 ? (
                  messages.map((msg: any) => (
                    <div key={msg._id} className="flex gap-3 items-start">
                      <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center shrink-0 border border-indigo-500/30">
                        <User size={14} className="text-indigo-400" />
                      </div>
                      <div className="flex flex-col max-w-[85%]">
                        <span className="text-xs text-gray-400 font-medium mb-1 ml-1">{currentUser && currentUser?.email===msg.author?.email?  'You' : msg.author.name}</span>
                        <div className="bg-[#2C2C2E] px-4 py-2.5 rounded-2xl rounded-tl-sm text-sm text-gray-200 shadow-sm border border-[#3C3C3E]">
                          {msg.content}
                        </div>
                      </div>
                      <div ref={messagesEndRef} />
                    </div>
                    
                  ))
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center opacity-50 py-12">
                    <MessageSquare size={48} className="text-gray-500 mb-3" />
                    <p className="text-gray-400 font-medium">No comments yet</p>
                    <p className="text-gray-500 text-sm mt-1">Be the first to share your thoughts!</p>
                  </div>
                )}
                
              </div>
              
              <div className="p-3 border-t border-[#3C3C3E] bg-[#2C2C2E]/30">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Write a comment..."
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && messageInput.trim()) {
                        messageSendHandler();
                      }
                    }}
                    className="flex-1 bg-[#1C1C1E] px-4 py-2 rounded-full border border-[#3C3C3E] text-sm text-gray-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-gray-500"
                  />
                  <button 
                    onClick={messageSendHandler} 
                    disabled={!messageInput.trim()} 
                    className="bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/50 disabled:cursor-not-allowed text-white px-5 py-2 rounded-full text-sm font-medium transition-colors shadow-sm"
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
