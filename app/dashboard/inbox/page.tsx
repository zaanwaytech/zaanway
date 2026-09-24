"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  FaSearch,
  FaPaperPlane,
  FaCheck,
  FaCheckDouble,
  FaUserCircle,
  FaSync,
  FaCommentDots,
} from "react-icons/fa";

interface ConversationItem {
  _id: string;
  customerPhone: string;
  customerName?: string;
  status: string;
  lastMessageAt: string;
  latestMessage?: string;
  latestMessageTimestamp?: string;
  latestMessageDirection?: string;
  latestMessageStatus?: string;
}

interface MessageItem {
  _id: string;
  direction: "incoming" | "outgoing";
  type: string;
  text?: string;
  status: string;
  timestamp: string;
  whatsappMessageId?: string;
}

export default function InboxPage() {
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<ConversationItem | null>(null);
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [inputText, setInputText] = useState("");
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 1. Fetch conversations belonging strictly to current workspace
  const fetchConversations = useCallback(async () => {
    try {
      const res = await fetch(`/api/conversations?search=${encodeURIComponent(searchQuery)}`, {
        cache: "no-store",
      });
      const data = await res.json();
      if (data.success) {
        setConversations(data.conversations || []);
        // If nothing is selected, select the first conversation
        if (!selectedConversation && data.conversations?.length > 0) {
          setSelectedConversation(data.conversations[0]);
        }
      }
    } catch (err) {
      console.error("Failed to load conversations:", err);
    } finally {
      setLoadingConversations(false);
    }
  }, [searchQuery, selectedConversation]);

  // 2. Fetch messages for the selected conversation
  const fetchMessages = useCallback(async (conversationId: string) => {
    try {
      const res = await fetch(`/api/conversations/${conversationId}/messages`, { cache: "no-store" });
      const data = await res.json();
      if (data.success) {
        setMessages(data.messages || []);
      }
    } catch (err) {
      console.error("Failed to load messages:", err);
    } finally {
      setLoadingMessages(false);
    }
  }, []);

  // Poll conversations every 5 seconds
  useEffect(() => {
    fetchConversations();
    const interval = setInterval(fetchConversations, 5000);
    return () => clearInterval(interval);
  }, [fetchConversations]);

  // When selected conversation changes, load its messages and poll every 3 seconds
  useEffect(() => {
    if (selectedConversation) {
      setLoadingMessages(true);
      fetchMessages(selectedConversation._id);

      const interval = setInterval(() => {
        fetchMessages(selectedConversation._id);
      }, 3000);

      return () => clearInterval(interval);
    }
  }, [selectedConversation, fetchMessages]);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 3. Send message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !selectedConversation || sending) return;

    const messageText = inputText.trim();
    setInputText("");
    setSending(true);

    try {
      const res = await fetch("/api/whatsapp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: selectedConversation._id,
          type: "text",
          text: messageText,
        }),
      });

      const data = await res.json();
      if (data.success) {
        // Optimistically add message
        if (data.message) {
          setMessages((prev) => [...prev, data.message]);
        }
        await fetchMessages(selectedConversation._id);
        await fetchConversations();
      } else {
        alert(data.message || "Failed to send WhatsApp message.");
        setInputText(messageText);
      }
    } catch (err) {
      console.error("Send message error:", err);
      alert("Network error sending WhatsApp message.");
      setInputText(messageText);
    } finally {
      setSending(false);
    }
  };

  const formatTime = (ts: string) => {
    if (!ts) return "";
    const date = new Date(ts);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="h-[calc(100vh-7rem)] flex flex-col space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">WhatsApp Inbox</h1>
          <p className="text-slate-500 text-xs">
            Direct two-way messaging with your WhatsApp customers.
          </p>
        </div>
        <button
          onClick={() => {
            fetchConversations();
            if (selectedConversation) fetchMessages(selectedConversation._id);
          }}
          className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition cursor-pointer text-xs flex items-center gap-1.5"
          title="Refresh Messages"
        >
          <FaSync size={13} /> Refresh
        </button>
      </div>

      <div className="flex-1 bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col md:flex-row">
        {/* Left: Contacts / Conversations List */}
        <div className="w-full md:w-80 lg:w-96 border-r border-slate-100 flex flex-col bg-slate-50/50">
          {/* Search box */}
          <div className="p-4 border-b border-slate-100 bg-white">
            <div className="relative">
              <FaSearch className="absolute left-3.5 top-3.5 text-slate-400 text-xs" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search phone or name..."
                className="w-full pl-9 pr-4 py-2.5 bg-slate-100 border-none rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-slate-700"
              />
            </div>
          </div>

          {/* List items */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {loadingConversations ? (
              <div className="p-8 text-center text-xs text-slate-400">Loading conversations...</div>
            ) : conversations.length === 0 ? (
              <div className="p-8 text-center text-slate-400 space-y-2">
                <FaCommentDots className="w-8 h-8 mx-auto text-slate-300" />
                <p className="text-xs font-semibold">No conversations found</p>
                <p className="text-[11px] text-slate-400">
                  When customers message your WhatsApp number, they will appear here.
                </p>
              </div>
            ) : (
              conversations.map((conv) => {
                const isSelected = selectedConversation?._id === conv._id;
                return (
                  <div
                    key={conv._id}
                    onClick={() => setSelectedConversation(conv)}
                    className={`p-4 flex items-start gap-3 cursor-pointer transition-colors ${
                      isSelected
                        ? "bg-emerald-50/80 border-l-4 border-emerald-500"
                        : "hover:bg-slate-100/60"
                    }`}
                  >
                    <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center flex-shrink-0 text-sm">
                      {conv.customerName ? conv.customerName[0].toUpperCase() : <FaUserCircle size={18} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-800 text-xs truncate">
                          {conv.customerName || conv.customerPhone}
                        </span>
                        <span className="text-[10px] text-slate-400 flex-shrink-0">
                          {formatTime(conv.latestMessageTimestamp || conv.lastMessageAt)}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                        {conv.customerPhone}
                      </div>
                      <div className="text-xs text-slate-500 truncate mt-1 flex items-center gap-1">
                        {conv.latestMessageDirection === "outgoing" && (
                          <span className="text-emerald-500 text-[10px]">
                            {conv.latestMessageStatus === "read" ? <FaCheckDouble /> : <FaCheck />}
                          </span>
                        )}
                        <span className="truncate">{conv.latestMessage}</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right: Active Chat Conversation */}
        <div className="flex-1 flex flex-col bg-white">
          {selectedConversation ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-white z-10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-500 text-white font-bold flex items-center justify-center text-sm shadow-sm">
                    {selectedConversation.customerName
                      ? selectedConversation.customerName[0].toUpperCase()
                      : "C"}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 text-sm">
                      {selectedConversation.customerName || "Customer"}
                    </h3>
                    <p className="text-xs text-slate-400 font-mono">
                      {selectedConversation.customerPhone}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded-full border border-emerald-100">
                    WhatsApp Cloud API
                  </span>
                </div>
              </div>

              {/* Message Thread History */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/40">
                {loadingMessages ? (
                  <div className="text-center text-xs text-slate-400 py-8">Loading messages...</div>
                ) : messages.length === 0 ? (
                  <div className="text-center text-xs text-slate-400 py-12">
                    No messages yet in this conversation. Send a message below to start chatting.
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isIncoming = msg.direction === "incoming";
                    return (
                      <div
                        key={msg._id}
                        className={`flex flex-col ${isIncoming ? "items-start" : "items-end"}`}
                      >
                        <div
                          className={`max-w-md px-4 py-3 rounded-2xl shadow-sm text-xs leading-relaxed ${
                            isIncoming
                              ? "bg-white text-slate-800 border border-slate-200/80 rounded-tl-sm"
                              : "bg-emerald-600 text-white rounded-tr-sm"
                          }`}
                        >
                          <div className="whitespace-pre-wrap">{msg.text}</div>
                          <div
                            className={`flex items-center justify-end gap-1 text-[9px] mt-1.5 ${
                              isIncoming ? "text-slate-400" : "text-emerald-100"
                            }`}
                          >
                            <span>{formatTime(msg.timestamp)}</span>
                            {!isIncoming && (
                              <span>
                                {msg.status === "read" ? (
                                  <FaCheckDouble className="text-emerald-200" />
                                ) : (
                                  <FaCheck />
                                )}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input */}
              <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-100 bg-white flex items-center gap-3">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Type a WhatsApp message..."
                  disabled={sending}
                  className="flex-1 border border-slate-200 rounded-xl px-4 py-3 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-800 disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={sending || !inputText.trim()}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white p-3.5 rounded-xl transition cursor-pointer disabled:opacity-50 shadow-md flex items-center justify-center flex-shrink-0"
                >
                  <FaPaperPlane size={14} className={sending ? "animate-pulse" : ""} />
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400">
              <FaCommentDots className="w-12 h-12 text-slate-200 mb-3" />
              <h3 className="font-bold text-slate-700 text-sm">Select a Conversation</h3>
              <p className="text-xs text-slate-400 max-w-sm mt-1">
                Choose a customer thread from the left to view message history and send replies.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
