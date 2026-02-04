import React, { useState, useEffect, useMemo } from 'react';
import { Search, Send, Paperclip, MoreVertical, MessageSquare, Phone, Video, Plus, X } from 'lucide-react';
import { useMockApp } from '../../../hooks/useMockApp';

const Messages = () => {
    const { currentUser, users, professionals, messages, sendMessage, markAsRead } = useMockApp();
    const [activeChatEmail, setActiveChatEmail] = useState(null);
    const [newMessage, setNewMessage] = useState('');
    const [showNewChat, setShowNewChat] = useState(false);
    const [searchEmail, setSearchEmail] = useState('');
    const [searchError, setSearchError] = useState('');

    // --- DERIVE CONVERSATIONS FROM GLOBAL MESSAGES ---
    const conversations = useMemo(() => {
        if (!currentUser) return [];

        const myEmail = currentUser.email;
        const relevantMessages = messages.filter(m => m.sender === myEmail || m.receiver === myEmail);

        // Group by the "other" person
        const groups = {};

        relevantMessages.forEach(msg => {
            const otherEmail = msg.sender === myEmail ? msg.receiver : msg.sender;
            if (!groups[otherEmail]) {
                // Find user details
                const otherUser = users.find(u => u.email === otherEmail) ||
                    professionals.find(p => p.email === otherEmail) ||
                    { name: otherEmail.split('@')[0], role: 'External', avatar: '👤', email: otherEmail };

                groups[otherEmail] = {
                    email: otherEmail,
                    name: otherUser.name,
                    role: otherUser.role,
                    avatar: otherUser.avatar || '👤',
                    online: false, // Mock
                    unread: 0,
                    messages: []
                };
            }
            groups[otherEmail].messages.push(msg);
        });

        // Convert to array and sort by last message time
        return Object.values(groups).map(group => {
            // Sort messages by timestamp
            group.messages.sort((a, b) => a.timestamp - b.timestamp);
            const lastMsg = group.messages[group.messages.length - 1];

            return {
                ...group,
                id: group.email, // Use email as unique ID for chat
                lastMessage: lastMsg ? lastMsg.text : '',
                lastMessageTime: lastMsg ? lastMsg.time : ''
            };
        }).sort((a, b) => {
            // Sort chats by last message timestamp (most recent first)
            const lastA = a.messages[a.messages.length - 1]?.timestamp || 0;
            const lastB = b.messages[b.messages.length - 1]?.timestamp || 0;
            return lastB - lastA;
        });

    }, [messages, currentUser, users, professionals]);

    useEffect(() => {
        // Set active chat to first if none selected and convos exist
        if (!activeChatEmail && conversations.length > 0) {
            setActiveChatEmail(conversations[0].email);
        }
    }, [conversations, activeChatEmail]);

    // --- EFFECT: Mark as Read ---
    useEffect(() => {
        if (activeChatEmail) {
            markAsRead(activeChatEmail);
        }
    }, [activeChatEmail, messages, markAsRead]);

    const activeConversation = conversations.find(c => c.email === activeChatEmail);

    const handleSendMessage = (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !activeChatEmail) return;

        sendMessage(currentUser.email, activeChatEmail, newMessage);
        setNewMessage('');
    };

    const startNewChat = (e) => {
        e.preventDefault();
        setSearchError('');

        if (!searchEmail.trim()) return;
        const targetEmail = searchEmail.trim().toLowerCase();

        if (targetEmail === currentUser.email) {
            setSearchError('You cannot message yourself.');
            return;
        }

        // Search in BOTH registered users and mock professionals
        const targetUser = users?.find(u => u.email.toLowerCase() === targetEmail) ||
            professionals?.find(p => p.email && p.email.toLowerCase() === targetEmail);

        if (!targetUser) {
            // Optional: Allow messaging unknown emails? For now, restrict to known users.
            setSearchError('User not found with this email.');
            return;
        }

        // Check if chat already exists
        const existingConv = conversations.find(c => c.email === targetUser.email);

        if (existingConv) {
            setActiveChatEmail(existingConv.email);
        } else {
            // We don't "create" a conversation object here strictly.
            // We just set the active chat email. 
            // The UI for "Active Chat" needs to handle the case where there are no messages yet but we selected a user.
            setActiveChatEmail(targetUser.email);
        }
        setShowNewChat(false);
        setSearchEmail('');
    };

    // Helper to get active user details if no conversation exists yet (new chat)
    const getActiveUserDetails = () => {
        if (activeConversation) return activeConversation;
        if (activeChatEmail) {
            const user = users.find(u => u.email === activeChatEmail) ||
                professionals.find(p => p.email === activeChatEmail);
            if (user) return { ...user, messages: [], avatar: user.avatar || '👤' };
        }
        return null;
    };

    const currentChatUser = getActiveUserDetails();

    return (
        <div className="flex h-[calc(100vh-8rem)] glass-card rounded-[2.5rem] shadow-xl border border-[#E3DACD]/50 overflow-hidden animate-fade-in relative">

            {/* New Chat Modal */}
            {showNewChat && (
                <div className="absolute inset-0 bg-[#2A1F1D]/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-[#FDFCF8] rounded-[2rem] shadow-2xl w-full max-w-md p-8 animate-scale-up border border-[#E3DACD]">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold font-serif text-[#2A1F1D]">New Message</h3>
                            <button onClick={() => setShowNewChat(false)} className="text-[#8C7B70] hover:text-[#C06842] transition-colors p-2 bg-[#F9F7F2] rounded-full">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={startNewChat} className="space-y-6">
                            <div>
                                <label className="block text-xs font-bold text-[#8C7B70] uppercase tracking-wider mb-2">Enter Email Address</label>
                                <input
                                    type="email"
                                    required
                                    value={searchEmail}
                                    onChange={(e) => setSearchEmail(e.target.value)}
                                    placeholder="user@example.com"
                                    className="w-full p-4 bg-white border border-[#E3DACD] rounded-xl outline-none focus:border-[#C06842] focus:ring-2 focus:ring-[#C06842]/20 text-[#2A1F1D] shadow-sm"
                                />
                                {searchError && <p className="text-red-500 text-xs mt-2 font-medium flex items-center gap-1">⚠️ {searchError}</p>}
                            </div>
                            <button
                                type="submit"
                                className="w-full py-4 bg-[#2A1F1D] hover:bg-[#C06842] text-white rounded-xl font-bold shadow-lg shadow-[#2A1F1D]/20 hover:shadow-[#C06842]/30 active:scale-95 transition-all"
                            >
                                Start Chat
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Sidebar - Chat List */}
            <div className={`w-full md:w-96 border-r border-[#E3DACD]/50 flex flex-col bg-[#FDFCF8]/50 backdrop-blur-sm ${activeChatEmail ? 'hidden md:flex' : 'flex'}`}>
                <div className="p-6 border-b border-[#E3DACD]/50 flex justify-between items-center">
                    <h2 className="text-2xl font-bold font-serif text-[#2A1F1D] flex items-center">
                        <MessageSquare className="w-6 h-6 mr-3 text-[#C06842]" />
                        Messages
                    </h2>
                    <button
                        onClick={() => setShowNewChat(true)}
                        className="p-3 bg-[#2A1F1D] text-white hover:bg-[#C06842] rounded-xl transition-all shadow-md hover:shadow-lg"
                        title="New Message"
                    >
                        <Plus className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-2">
                    {conversations.map(chat => (
                        <div
                            key={chat.email}
                            onClick={() => setActiveChatEmail(chat.email)}
                            className={`p-4 flex items-start space-x-4 cursor-pointer rounded-2xl transition-all border ${activeChatEmail === chat.email ? 'bg-[#F9F7F2] border-[#C06842]/30 shadow-sm' : 'border-transparent hover:bg-white/60 hover:border-[#E3DACD]/50'}`}
                        >
                            <div className="relative">
                                <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-xl shadow-sm border border-[#E3DACD]">
                                    {chat.avatar}
                                </div>
                                {chat.online && (
                                    <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white shadow-sm"></div>
                                )}
                            </div>
                            <div className="flex-1 min-w-0 pt-1">
                                <div className="flex justify-between items-start mb-1">
                                    <h3 className={`font-bold text-sm truncate ${activeChatEmail === chat.email ? 'text-[#2A1F1D]' : 'text-[#5D4037]'}`}>{chat.name}</h3>
                                    {chat.unread > 0 && (
                                        <span className="bg-[#C06842] text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                                            {chat.unread}
                                        </span>
                                    )}
                                </div>
                                <p className="text-[10px] text-[#8C7B70] uppercase tracking-wider font-bold mb-1.5">{chat.role}</p>
                                <p className={`text-xs truncate ${chat.unread > 0 ? 'font-bold text-[#2A1F1D]' : 'text-[#B8AFA5]'}`}>
                                    {chat.lastMessage}
                                </p>
                            </div>
                        </div>
                    ))}
                    {conversations.length === 0 && (
                        <div className="p-10 text-center text-[#B8AFA5] text-sm">
                            <p className="mb-4">No conversations yet.</p>
                            <button onClick={() => setShowNewChat(true)} className="text-[#C06842] font-bold hover:underline">Start a new chat</button>
                        </div>
                    )}
                </div>
            </div>

            {/* Main Chat Area */}
            {currentChatUser ? (
                <div className={`flex-1 flex flex-col bg-white/40 backdrop-blur-sm ${activeChatEmail ? 'flex' : 'hidden md:flex'}`}>
                    {/* Chat Header */}
                    <div className="p-6 bg-white/60 border-b border-[#E3DACD]/50 flex justify-between items-center backdrop-blur-md z-10">
                        <div className="flex items-center space-x-4">
                            {/* Mobile Back Button */}
                            <button onClick={() => setActiveChatEmail(null)} className="md:hidden p-2 mr-2 text-[#8C7B70] hover:bg-[#F9F7F2] rounded-full">
                                <X className="w-5 h-5" />
                            </button>

                            <div className="w-12 h-12 rounded-full bg-[#FDFCF8] flex items-center justify-center text-xl shadow-sm border border-[#E3DACD]">
                                {currentChatUser.avatar}
                            </div>
                            <div>
                                <h3 className="font-bold text-lg text-[#2A1F1D] font-serif">{currentChatUser.name}</h3>
                                <div className="flex items-center text-xs text-green-600 font-bold h-4">
                                    {currentChatUser.online && (
                                        <>
                                            <div className="w-2 h-2 bg-green-500 rounded-full mr-1.5 shadow-[0_0_8px_rgba(34,197,94,0.4)]"></div>
                                            Online
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center space-x-2 text-[#8C7B70]">
                            <button className="p-3 hover:bg-[#F9F7F2] hover:text-[#C06842] rounded-xl transition-all"><Phone className="w-5 h-5" /></button>
                            <button className="p-3 hover:bg-[#F9F7F2] hover:text-[#C06842] rounded-xl transition-all"><Video className="w-5 h-5" /></button>
                            <button className="p-3 hover:bg-[#F9F7F2] hover:text-[#C06842] rounded-xl transition-all"><MoreVertical className="w-5 h-5" /></button>
                        </div>
                    </div>

                    {/* Messages Feed */}
                    <div className="flex-1 overflow-y-auto p-8 space-y-6">
                        {currentChatUser.messages.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-[#B8AFA5] space-y-4">
                                <div className="p-6 bg-[#F9F7F2] rounded-full">
                                    <MessageSquare className="w-12 h-12 opacity-50 text-[#C06842]" />
                                </div>
                                <p className="font-medium">No messages yet. Say hello!</p>
                            </div>
                        ) : (
                            currentChatUser.messages.map(msg => (
                                <div key={msg.id} className={`flex ${msg.sender === currentUser.email ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`flex flex-col max-w-[70%] ${msg.sender === currentUser.email ? 'items-end' : 'items-start'}`}>
                                        <div
                                            className={`px-6 py-4 rounded-2xl text-sm font-medium leading-relaxed shadow-sm ${msg.sender === currentUser.email
                                                ? 'bg-[#2A1F1D] text-white rounded-tr-none'
                                                : 'bg-white text-[#2A1F1D] border border-[#E3DACD] rounded-tl-none'
                                                }`}
                                        >
                                            {msg.text}
                                        </div>
                                        <span className="text-[10px] text-[#B8AFA5] mt-1.5 px-1 font-bold">{msg.time}</span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Input Area */}
                    <div className="p-6 bg-white/60 border-t border-[#E3DACD]/50 backdrop-blur-md">
                        <form onSubmit={handleSendMessage} className="flex items-end space-x-3">
                            <button type="button" className="p-3.5 text-[#8C7B70] hover:text-[#C06842] hover:bg-[#F9F7F2] rounded-xl transition-colors">
                                <Paperclip className="w-5 h-5" />
                            </button>
                            <div className="flex-1 relative">
                                <input
                                    type="text"
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    placeholder="Type a message..."
                                    className="w-full p-4 bg-white border border-[#E3DACD] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C06842]/20 focus:border-[#C06842] transition-all text-sm placeholder:text-[#B8AFA5] shadow-sm"
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={!newMessage.trim()}
                                className="p-4 bg-[#C06842] hover:bg-[#A65D3B] text-white rounded-xl shadow-lg shadow-[#C06842]/30 transition-all disabled:opacity-50 disabled:shadow-none hover:-translate-y-0.5 active:translate-y-0"
                            >
                                <Send className="w-5 h-5" />
                            </button>
                        </form>
                    </div>
                </div>
            ) : (
                <div className="hidden md:flex flex-1 flex-col items-center justify-center bg-[#FDFCF8]/30 text-[#8C7B70]">
                    <div className="p-8 bg-white rounded-[2rem] shadow-sm border border-[#E3DACD] flex flex-col items-center">
                        <MessageSquare className="w-16 h-16 opacity-30 mb-4 text-[#C06842]" />
                        <p className="text-lg font-bold font-serif text-[#5D4037]">Select a conversation</p>
                        <p className="text-sm mt-2 opacity-70">or start a new one to connect</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Messages;
