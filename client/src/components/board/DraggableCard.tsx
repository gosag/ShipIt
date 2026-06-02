import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { useState } from 'react';
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
  const messageSendHandler=async()=>{
    const res= await  api.post(`/api/messages/send-message/${card._id}`, { 
      content: messageInput,
      workspace: workspaceId,
      card: card._id,
    });
    if(res.status === 201){
      setMessages(prev => [messageInput, ...prev]);
      setMessageInput("");
      alert("Message sent successfully!");
    } else {
      alert("Failed to send message.");
    }
  }
  const getMessagesHandler=async (cardId)=>{
    try{
      const res= await api.get(`/api/messages/get-messages/${cardId}`);
      if(res.status === 200){
        console.log("Messages for card", cardId, res.data);
        setMessages(res.data);
      }
    }catch(err){
      console.error("Failed to fetch messages for card", cardId, err);
    }
}
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
            onClick={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
            className="mt-2 p-2 bg-[#2C2C2E]/90 fixed rounded inset-0 backdrop-blur-md w-screen h-screen flex flex-col items-center justify-center z-100"
          >
            {
              messages.length > 0 ? (
                <div className='bg-[#1C1C1E] p-4 rounded w-full max-w-md max-h-[70vh] overflow-y-auto'>
                  {messages.map((msg) => (
                    <div key={msg._id} className='mb-3'>
                      <div className='flex items-center gap-2 mb-1'>
                        <User size={16} />
                        
                      </div>
                      <p className='text-gray-300 text-sm'>{msg.content}</p>
                    </div>
                  ))}
                </div>
            ) : (
              <div className='bg-[#1C1C1E] p-4 rounded w-full max-w-md flex items-center justify-center h-24'>
                <p className='text-gray-500'>No messages yet. Be the first to comment!</p>
              </div>
            )}
            <button 
              onClick={(e)=>{e.stopPropagation(); setShowMessages(false)}} 
              onPointerDown={(e) => e.stopPropagation()}
              className="absolute top-4 right-4 p-2 rounded hover:bg-[#3C3C3E] transition-colors"
            >
              <X size={24} className="text-gray-400 hover:text-gray-200 transition-colors" />
            </button>
            <div className='flex items-end gap-2 mt-4'>
              <input
                type="text"
                placeholder="Type a message..."
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                className="bg-[#2C2C2E] text-gray-400 placeholder:text-gray-500 border border-[#3C3C3E] focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button onClick={messageSendHandler} disabled={!messageInput.trim()} className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 transition-colors">
                Send
              </button>
            </div>
          </div>
        )}
      </div>
  );
};
