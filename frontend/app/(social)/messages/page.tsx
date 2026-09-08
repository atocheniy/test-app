'use client'

import BottomInput from "@/components/bottomInput";
import MessagePreview from "@/components/messagePreview";
import ReceivedMessage from "@/components/receivedMessage";
import SentMessage from "@/components/sentMessage";
import Titlebar from "@/components/titlebar";
import TitlebarMessage from "@/components/titlebarMessage";
import { useApplication } from "@/context/ApplicationContext";
import { ChatItem, ChatService, MessageItem } from "@/services/chatService";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";

import * as signalR from "@microsoft/signalr";
import { Edit, Reply, X } from "lucide-react";

function MessagesContent() {
     const searchParams = useSearchParams();
    const queryChatId = searchParams.get('chatId');

    const { userData, connection, onlineUsers } = useApplication();

    const [chats, setChats] = useState<ChatItem[]>([]);
    const [activeChat, setActiveChat] = useState<ChatItem | null>(null);
    const [messages, setMessages] = useState<MessageItem[]>([]);
    const [inputText, setInputText] = useState("");
    const [loading, setLoading] = useState(false);
    
    const [editingMessage, setEditingMessage] = useState<{ id: string; content: string; attachments?: string[] } | null>(null);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [replyingMessage, setReplyingMessage] = useState<{ id: string; content: string; authorName: string } | null>(null);

    const handleStartReply = (msg: { id: string; content: string; authorName: string }) => {
        setReplyingMessage(msg);
        setEditingMessage(null);
    };

    const [isPartnerTyping, setIsPartnerTyping] = useState(false);
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const lastTypingSentRef = useRef<number>(0);

    const activeChatRef = useRef<ChatItem | null>(null);
    useEffect(() => {
        activeChatRef.current = activeChat;
    }, [activeChat]);

    useEffect(() => {
        if (activeChat) {
            ChatService.markAsRead(activeChat.id).catch(console.error);
        }
    }, [activeChat?.id]);

    useEffect(() => {
        document.title = 'Messages';
        loadChats();
    }, [queryChatId]);

     const loadChats = async () => {
        try {
            const data = await ChatService.getMyChats();
            setChats(data);

            if (queryChatId) {
                const targetChat = data.find(c => c.id === queryChatId);
                if (targetChat) {
                    handleSelectChat(targetChat);
                    return;
                }
            }

            if (data.length > 0 && !activeChat) {
                handleSelectChat(data[0]);
            }
        } catch (error) {
            console.error("Ошибка загрузки чатов:", error);
        }
     };

    const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setInputText(e.target.value);

        const now = Date.now();
        if (now - lastTypingSentRef.current > 1500 && connection && activeChat) {
            lastTypingSentRef.current = now;
            connection.invoke("SendTyping", activeChat.id.toLowerCase(), userData.userName).catch(console.error);
        }
    };

     const handleSelectChat = async (chat: ChatItem) => {
        if (activeChat?.id === chat.id) return;

        if (activeChat && connection) {
            await connection.invoke("LeaveChat", activeChat.id).catch(console.error);
        }

        setActiveChat(chat);
        setLoading(true);

        if (connection && connection.state === signalR.HubConnectionState.Connected) {
            connection.invoke("JoinChat", chat.id.toLowerCase()).catch(console.error);
        }

        try {
            const history = await ChatService.getMessages(chat.id);
            setMessages(history.reverse());
        } catch (error) {
            console.error("Ошибка загрузки сообщений:", error);
        } finally {
            setLoading(false);
        }
     };

     useEffect(() => {
        if (!connection || !activeChat) return;

        if (connection.state === signalR.HubConnectionState.Connected) {
            connection.invoke("JoinChat", activeChat.id)
                .then(() => console.log(`Вход в чат: ${activeChat.id}`))
                .catch(err => console.error("Ошибка входа в комнату:", err));
        }

        return () => {
            if (connection.state === signalR.HubConnectionState.Connected) {
                connection.invoke("LeaveChat", activeChat.id).catch(console.error);
            }
        };
    }, [connection, activeChat?.id]);

     useEffect(() => {
        if (!connection) return;

        const handleReceiveMessage = (newMessage: MessageItem) => {
            console.log("Входящее сообщение:", newMessage);

            const currentActive = activeChatRef.current;

            if (currentActive && newMessage.chatId.toLowerCase() === currentActive.id.toLowerCase()) {
                const isMine = newMessage.senderId === userData?.id;
                
                setMessages(prev => {
                    if (prev.some(m => m.id.toLowerCase() === newMessage.id.toLowerCase())) return prev;
                    return [...prev, {
                        ...newMessage,
                        isMine: newMessage.senderId === userData?.id
                    }];
                });

                if (!isMine) {
                    ChatService.markAsRead(currentActive.id).catch(console.error);
                }
            }

            setChats(prev => prev.map(c => 
                c.id.toLowerCase() === newMessage.chatId.toLowerCase() 
                    ? { ...c, content: newMessage.content || (newMessage.attachments?.length ? "📷 Photo" : ""), time: newMessage.time }
                    : c
            ));
        };

        const handleMessageDeleted = (data: { id?: string; Id?: string; chatId?: string; ChatId?: string }) => {
            const deletedId = (data.id || data.Id)?.toLowerCase();
            const chatId = (data.chatId || data.ChatId)?.toLowerCase();

            console.log("Сообщение удалено через SignalR:", deletedId);

            setMessages((prev) => {
                const updated = prev.filter((m) => m.id.toLowerCase() !== deletedId);
                
                const lastMsg = updated[updated.length - 1];
                if (lastMsg) {
                    setChats((prevChats) => prevChats.map((c) => 
                        c.id.toLowerCase() === chatId 
                            ? { ...c, content: lastMsg.content || (lastMsg.attachments?.length ? "Attachment" : ""), time: lastMsg.time }
                            : c
                    ));
                }
                return updated;
            });
        };


        const handleMessageEdited = (data: { id?: string; Id?: string; chatId?: string; ChatId?: string; content?: string; Content?: string; attachments?: string[]; Attachments?: string[] }) => {
            const editedId = (data.id || data.Id)?.toLowerCase();
            const chatId = (data.chatId || data.ChatId)?.toLowerCase();
            const newContent = data.content ?? data.Content ?? "";
            const newAttachments = data.attachments ?? data.Attachments ?? [];

            setMessages((prev) => prev.map((m) => 
                m.id.toLowerCase() === editedId
                    ? { ...m, content: newContent, attachments: newAttachments }
                    : m
            ));

            setChats((prev) => prev.map((c) => 
                c.id.toLowerCase() === chatId
                    ? { ...c, content: newContent || (newAttachments.length ? "📷 Фотография" : c.content) }
                    : c
            ));
        };
        
        const handleMessagesRead = (data: { chatId?: string; ChatId?: string }) => {
            const chatId = (data.chatId || data.ChatId)?.toLowerCase();

            if (activeChatRef.current && activeChatRef.current.id.toLowerCase() === chatId) {
                setMessages((prev) => prev.map((m) => m.isMine ? { ...m, isRead: true } : m));
            }
        };

        connection.on("ReceiveMessage", handleReceiveMessage);
        connection.on("MessageDeleted", handleMessageDeleted);
        connection.on("MessageEdited", handleMessageEdited);
        connection.on("MessagesRead", handleMessagesRead);

        const handleUserTyping = ({ chatId }: { chatId: string }) => {
            if (activeChatRef.current && chatId.toLowerCase() === activeChatRef.current.id.toLowerCase()) {
                setIsPartnerTyping(true);

                if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
                typingTimeoutRef.current = setTimeout(() => {
                    setIsPartnerTyping(false);
                }, 2500);
            }
        };
        connection.on("UserTyping", handleUserTyping);

        return () => {
            connection.off("ReceiveMessage", handleReceiveMessage);
            connection.off("UserTyping", handleUserTyping);
            connection.off("MessageDeleted", handleMessageDeleted); 
            connection.off("MessageEdited", handleMessageEdited);
            connection.off("MessagesRead", handleMessagesRead);
        };
    }, [connection, userData?.id]);

     useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
     }, [messages]);
    
     const handleSendMessage = async (attachments: string[] = []) => {
        if ((!inputText.trim() && attachments.length === 0) || !activeChat) return;

        const textToSend = inputText.trim();
        const replyToId = replyingMessage?.id;

        if (editingMessage) {
            const messageId = editingMessage.id;
            const finalAttachments = attachments.length > 0 ? attachments : (editingMessage.attachments || []);

            setEditingMessage(null);
            setInputText("");

            setMessages((prev) => prev.map((m) => 
                m.id === messageId 
                    ? { ...m, content: textToSend, attachments: finalAttachments } 
                    : m
            ));

            try {
                await ChatService.updateMessage(messageId, activeChat.id, textToSend, finalAttachments);
            } catch (error) {
                console.error("Ошибка редактирования:", error);
            }
            return;
        }

        setReplyingMessage(null);
        setInputText("");
        
        try {
             const sentMessage = await ChatService.sendMessage(activeChat.id, textToSend, attachments, replyToId);
            setMessages(prev => {
                if (prev.some(m => m.id.toLowerCase() === sentMessage.id.toLowerCase())) return prev;
                return [...prev, { ...sentMessage, isMine: true }];
            });

            setChats(prev => prev.map(c => 
                c.id.toLowerCase() === activeChat.id.toLowerCase()
                    ? { ...c, content: sentMessage.content || (attachments.length ? "📷 Фото" : ""), time: sentMessage.time }
                    : c
            ));
        } catch (error) {
            console.error("Ошибка отправки:", error);
        }
    };

    const handleDeleteMessage = async (messageId: string) => {
        setMessages((prev) => prev.filter((m) => m.id.toLowerCase() !== messageId.toLowerCase()));

        try {
            await ChatService.deleteMessage(messageId);
        } catch (error) {
            console.error("Ошибка при удалении сообщения:", error);
            if (activeChat) {
                const history = await ChatService.getMessages(activeChat.id);
                setMessages(history.reverse());
            }
        }
    };


    const handleStartEdit = (id: string, content: string, attachments?: string[]) => {
        setEditingMessage({ id, content, attachments });
        setInputText(content);
    };

    const handleCancelEdit = () => {
        setEditingMessage(null);
        setInputText("");
    };

    const isPartnerOnline = activeChat?.userName 
        ? onlineUsers?.includes(activeChat.userName)
        : false;

    return (
          <div className="flex flex-row h-full" >
               <div className="flex flex-col w-[500px] max-sm:w-full border-r border-white/5 overflow-y-auto no-scrollbar max-sm:border-r-0 min-h-full">
                    <Titlebar title="Messages"></Titlebar>

                    <div className="flex flex-col">
                         {chats.length === 0 ? (
                         <div className="p-4 text-center text-zinc-500">No chats yet</div>
                         ) : (
                          chats.map(chat => {

                               const isUserOnline = chat.userName 
                ? onlineUsers?.includes(chat.userName) 
                : false;
                         return (
                              <div 
                                   key={chat.id} 
                                   onClick={() => handleSelectChat(chat)}
                                   className={`cursor-pointer transition ${activeChat?.id === chat.id ? 'bg-white/5' : 'hover:bg-white/[0.02]'}`}
                              >
                                   <MessagePreview 
                                        Id={chat.id} 
                                        Name={chat.name} 
                                        UserName={chat.userName || ""} 
                                        Content={chat.content || "No messages yet"} 
                                        Time={chat.time} 
                                        Avatar={chat.avatar || userData.avatar} 
                                        isOnline={isUserOnline}
                                   />
                              </div>
                               );
                              })
                    )}
                    </div>
                </div>
               {activeChat ? (
                <div className="flex flex-col w-full h-full max-sm:hidden overflow-y-auto no-scrollbar">
                   <TitlebarMessage 
                        Id={activeChat.id} 
                        Name={activeChat.name} 
                        UserName={activeChat.userName || ""} 
                        Info={isPartnerOnline ? "Online" : "Offline"} 
                        Avatar={activeChat.avatar || userData.avatar} 
                        isOnline={isPartnerOnline}
                        onClose={() => setActiveChat(null)}
                        isTyping={isPartnerTyping}
                    />

                     <div className="flex-1 p-4 flex flex-col gap-1 overflow-y-auto">
                        {loading ? (
                            <div className="text-center text-zinc-500 my-auto">Loading messages...</div>
                        ) : messages.length === 0 ? (
                            <div className="text-center text-zinc-500 my-auto">Write first message</div>
                        ) : (
                            messages.map((msg) => 
                                msg.isMine ? (
                                    <SentMessage 
                                        key={msg.id} 
                                        Id={msg.id} 
                                        Content={msg.content} 
                                        Attachments={msg.attachments}
                                        ReplyTo={msg.replyTo}
                                        AuthorName="You"
                                        Time={msg.time} 
                                        IsRead={msg.isRead}
                                        onDelete={handleDeleteMessage}
                                        onEdit={handleStartEdit}
                                        onReply={handleStartReply}
                                    />
                                ) : (
                                    <ReceivedMessage 
                                        key={msg.id} 
                                        Id={msg.id} 
                                        Content={msg.content} 
                                        Attachments={msg.attachments}
                                        ReplyTo={msg.replyTo}
                                        AuthorName={activeChat.name}
                                        Time={msg.time} 
                                        onReply={handleStartReply}
                                    />
                                )
                            )
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {replyingMessage && (
                        <div className="flex items-center justify-between px-4 py-2 bg-zinc-900 border-t border-white/5 text-xs text-zinc-300 animate-in fade-in slide-in-from-bottom-2 duration-150">
                            <div className="flex items-center gap-2 truncate">
                                <Reply size={14} className="text-sky-400 shrink-0" />
                                <div className="flex flex-col truncate">
                                    <span className="font-semibold text-sky-400 text-[11px]">
                                        Replying to {replyingMessage.authorName}
                                    </span>
                                    <span className="truncate text-zinc-400 text-[11px] max-w-md">
                                        {replyingMessage.content || "📷 Attachment"}
                                    </span>
                                </div>
                            </div>
                            <button 
                                onClick={() => setReplyingMessage(null)}
                                className="p-1 hover:bg-white/10 rounded-full text-zinc-400 hover:text-zinc-200 transition-colors"
                                title="Cancel reply"
                            >
                                <X size={14} />
                            </button>
                        </div>
                    )}

                    {editingMessage && (
                        <div className="flex items-center justify-between px-4 py-2 bg-zinc-900 border-t border-white/5 text-xs text-zinc-300 animate-in fade-in slide-in-from-bottom-2 duration-150">
                            <div className="flex items-center gap-2 truncate">
                                <Edit size={14} className="text-sky-400 shrink-0" />
                                <span className="font-semibold text-sky-400">Editing message:</span>
                                <span className="truncate text-zinc-400 max-w-md">{editingMessage.content}</span>
                            </div>
                            <button 
                                onClick={handleCancelEdit}
                                className="p-1 hover:bg-white/10 rounded-full text-zinc-400 hover:text-zinc-200 transition-colors"
                                title="Cancel edit"
                            >
                                <X size={14} />
                            </button>
                        </div>
                    )}

                    <BottomInput 
                        value={inputText}
                        onChange={handleInputChange}
                        onSend={handleSendMessage}
                        placeholder="Type a message..."
                    />
                </div>
               ) : (
               <div className="hidden sm:flex flex-1 items-center justify-center text-zinc-600">
                    Select a conversation to start messaging
               </div>
          )}
     </div>
    )
}

export default function Messages() {
    return (
        <Suspense fallback={<div className="flex h-full items-center justify-center text-zinc-500">Loading messages...</div>}>
            <MessagesContent />
        </Suspense>
    );
}