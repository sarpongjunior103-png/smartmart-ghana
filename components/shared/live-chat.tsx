// @ts-nocheck
'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Send, X, Loader2, Paperclip, Image as ImageIcon, Check, CheckCheck } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase/client';
import type { ChatConversation, ChatMessage } from '@/lib/types';

export function LiveChat() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<ChatConversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [otherUser, setOtherUser] = useState<{ email: string; first_name: string | null; last_name: string | null } | null>(null);
  const [otherUserOnline, setOtherUserOnline] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // Load conversations
  useEffect(() => {
    if (!user) return;
    (async () => {
      const res = await fetch(`/api/chat?userId=${user.id}`);
      const data = await res.json();
      if (data.conversations) setConversations(data.conversations);
    })();

    // Subscribe to new messages
    const channel = supabase
      .channel('chat_messages')
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chat_messages' },
        (payload) => {
          const newMessage = payload.new as ChatMessage;
          if (activeConversation && newMessage.conversation_id === activeConversation.id) {
            setMessages((prev) => [...prev, newMessage]);
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user, activeConversation]);

  // Load messages when conversation changes
  useEffect(() => {
    if (!activeConversation) return;
    setLoadingMessages(true);
    (async () => {
      const res = await fetch(`/api/chat?conversationId=${activeConversation.id}`);
      const data = await res.json();
      if (data.messages) setMessages(data.messages);

      // Get other user info
      const otherId = activeConversation.participant1_id === user?.id
        ? activeConversation.participant2_id
        : activeConversation.participant1_id;
      const { data: profile } = await supabase.from('profiles').select('email, first_name, last_name').eq('id', otherId).maybeSingle();
      setOtherUser(profile);

      // Mark messages as read
      if (user) {
        await fetch('/api/chat', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ conversation_id: activeConversation.id, user_id: user.id }),
        });
      }
      setLoadingMessages(false);
    })();
  }, [activeConversation, user]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const startSupportChat = useCallback(async () => {
    if (!user) return;
    // Find or create a support conversation with admin
    const { data: admin } = await supabase.from('profiles').select('id').eq('role', 'admin').maybeSingle();
    if (!admin) return;

    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'create_conversation',
        participant1_id: user.id,
        participant2_id: admin.id,
        type: 'customer_support',
      }),
    });
    const data = await res.json();
    if (data.conversation) {
      setActiveConversation(data.conversation);
      setConversations((prev) => prev.some((c) => c.id === data.conversation.id) ? prev : [data.conversation, ...prev]);
    }
  }, [user]);

  const handleSend = async () => {
    if (!input.trim() || !user || !activeConversation) return;
    const content = input;
    setInput('');
    setLoading(true);

    // Optimistic message
    const optimistic: ChatMessage = {
      id: 'temp-' + Date.now(),
      conversation_id: activeConversation.id,
      sender_id: user.id,
      message_type: 'text',
      content,
      file_url: null,
      file_name: null,
      file_size: null,
      is_read: false,
      read_at: null,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimistic]);

    try {
      await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'send_message',
          conversation_id: activeConversation.id,
          sender_id: user.id,
          message_type: 'text',
          content,
        }),
      });
    } catch {
      // Revert on error
      setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
    }
    setLoading(false);
  };

  const handleFileUpload = async (file: File, type: 'image' | 'file') => {
    if (!user || !activeConversation) return;
    setLoading(true);

    try {
      const fileName = `${Date.now()}-${file.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('chat-files')
        .upload(`${user.id}/${fileName}`, file);

      if (uploadError) {
        // Fallback: send as text with file name
        await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'send_message',
            conversation_id: activeConversation.id,
            sender_id: user.id,
            message_type: type,
            content: file.name,
            file_name: file.name,
            file_size: file.size,
          }),
        });
      } else if (uploadData) {
        const { data: urlData } = supabase.storage.from('chat-files').getPublicUrl(uploadData.path);
        await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'send_message',
            conversation_id: activeConversation.id,
            sender_id: user.id,
            message_type: type,
            content: file.name,
            file_url: urlData.publicUrl,
            file_name: file.name,
            file_size: file.size,
          }),
        });
      }
    } catch {
      // ignore
    }
    setLoading(false);
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' });
  };

  if (!user) return null;

  return (
    <>
      {/* Floating button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-24 right-6 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg hover:shadow-xl transition-all hover:scale-105"
          aria-label="Open Live Chat"
        >
          <MessageSquare className="h-5 w-5" />
        </button>
      )}

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-24 right-6 z-50 w-[calc(100vw-3rem)] sm:w-96 h-[500px] flex flex-col">
          <Card className="flex flex-col shadow-2xl overflow-hidden h-full">
            {/* Header */}
            <div className="flex items-center justify-between bg-blue-600 p-3 text-white">
              <div className="flex items-center gap-2">
                {activeConversation && (
                  <button
                    onClick={() => setActiveConversation(null)}
                    className="text-white/80 hover:text-white text-xs"
                  >
                    ←
                  </button>
                )}
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-white/20 text-white text-xs">
                        {activeConversation && otherUser ? (otherUser.first_name?.[0] || otherUser.email[0] || 'S').toUpperCase() : 'S'}
                      </AvatarFallback>
                    </Avatar>
                    {otherUserOnline && (
                      <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-green-400 border-2 border-blue-600" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-sm">
                      {activeConversation && otherUser ? (otherUser.first_name || 'Support Agent') : 'Live Chat'}
                    </p>
                    <p className="text-xs text-white/70">
                      {activeConversation ? (otherUserOnline ? 'Online' : isTyping ? 'typing...' : 'Offline') : 'Select a conversation'}
                    </p>
                  </div>
                </div>
              </div>
              <button onClick={() => setOpen(false)} className="rounded-lg p-1 hover:bg-white/10">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content area */}
            <div className="flex-1 overflow-hidden flex flex-col">
              {!activeConversation ? (
                /* Conversation list */
                <div className="flex-1 overflow-y-auto p-3 space-y-2">
                  {conversations.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground py-8">
                      <MessageSquare className="h-10 w-10 mb-3 opacity-50" />
                      <p className="text-sm mb-3">No conversations yet</p>
                      <Button size="sm" onClick={startSupportChat}>Start Support Chat</Button>
                    </div>
                  ) : (
                    <>
                      <Button size="sm" variant="outline" onClick={startSupportChat} className="w-full mb-2">
                        + New Support Chat
                      </Button>
                      {conversations.map((conv) => (
                        <button
                          key={conv.id}
                          onClick={() => setActiveConversation(conv)}
                          className="w-full text-left rounded-lg border p-3 hover:bg-accent transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium capitalize">
                              {conv.type.replace('_', ' ')}
                            </span>
                            <Badge variant="secondary" className="text-xs">
                              {new Date(conv.last_message_at).toLocaleDateString('en')}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(conv.last_message_at).toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </button>
                      ))}
                    </>
                  )}
                </div>
              ) : (
                /* Messages */
                <>
                  <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-2 bg-muted/30">
                    {loadingMessages ? (
                      <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
                    ) : (
                      messages.map((msg, i) => {
                        const isOwn = msg.sender_id === user.id;
                        const prevMsg = messages[i - 1];
                        const showDate = !prevMsg || new Date(prevMsg.created_at).toDateString() !== new Date(msg.created_at).toDateString();

                        return (
                          <div key={msg.id}>
                            {showDate && (
                              <div className="flex justify-center my-2">
                                <span className="text-xs text-muted-foreground bg-background px-2 py-0.5 rounded-full">
                                  {new Date(msg.created_at).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
                                </span>
                              </div>
                            )}
                            <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                              <div className={`max-w-[75%] rounded-2xl px-3 py-2 ${isOwn ? 'bg-blue-600 text-white' : 'bg-background border'}`}>
                                {msg.message_type === 'image' && msg.file_url ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img src={msg.file_url} alt={msg.file_name || ''} className="rounded-lg max-h-40 mb-1" />
                                ) : msg.message_type === 'file' && msg.file_url ? (
                                  <a href={msg.file_url} target="_blank" rel="noopener noreferrer" className={`flex items-center gap-2 text-sm underline ${isOwn ? 'text-white' : 'text-blue-600'}`}>
                                    <Paperclip className="h-4 w-4" /> {msg.file_name}
                                  </a>
                                ) : null}
                                <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                                <div className={`flex items-center gap-1 mt-0.5 ${isOwn ? 'justify-end' : ''}`}>
                                  <span className={`text-[10px] ${isOwn ? 'text-white/60' : 'text-muted-foreground'}`}>
                                    {formatTime(msg.created_at)}
                                  </span>
                                  {isOwn && (
                                    msg.is_read ? <CheckCheck className="h-3 w-3 text-white/60" /> : <Check className="h-3 w-3 text-white/60" />
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                    {isTyping && (
                      <div className="flex justify-start">
                        <div className="bg-background border rounded-2xl px-4 py-2">
                          <div className="flex gap-1">
                            <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '0ms' }} />
                            <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '150ms' }} />
                            <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '300ms' }} />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Input */}
                  <div className="border-t p-2 flex items-center gap-1 bg-background">
                    <input
                      ref={fileInputRef}
                      type="file"
                      className="hidden"
                      onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileUpload(f, 'file'); }}
                    />
                    <input
                      ref={imageInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileUpload(f, 'image'); }}
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="p-2 rounded-lg hover:bg-accent text-muted-foreground"
                      title="Attach file"
                    >
                      <Paperclip className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => imageInputRef.current?.click()}
                      className="p-2 rounded-lg hover:bg-accent text-muted-foreground"
                      title="Send image"
                    >
                      <ImageIcon className="h-4 w-4" />
                    </button>
                    <input
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                      placeholder="Type a message..."
                      className="flex-1 rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      disabled={loading}
                    />
                    <Button size="icon" onClick={handleSend} disabled={loading || !input.trim()} className="shrink-0 bg-blue-600 hover:bg-blue-700">
                      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    </Button>
                  </div>
                </>
              )}
            </div>
          </Card>
        </div>
      )}
    </>
  );
}
