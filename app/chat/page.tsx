// @ts-nocheck
'use client';
export const dynamic = 'force-dynamic';

import { useCallback, useEffect, useRef, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Navbar } from '@/components/shared/navbar';
import { Footer } from '@/components/shared/footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Send, Loader2, MessageCircle, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth-context';
import type { ChatConversation, ChatMessage, Profile } from '@/lib/types';
import { cn } from '@/lib/utils';

/* ---------- helpers ---------- */

function fullName(p: Profile | null): string {
  if (!p) return 'Unknown user';
  const first = p.first_name ?? '';
  const last = p.last_name ?? '';
  const name = `${first} ${last}`.trim();
  return name || p.email || 'Unknown user';
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function formatTime(iso: string): string {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    const now = new Date();
    const sameDay = d.toDateString() === now.toDateString();
    if (sameDay) {
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    if (d.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    }
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  } catch {
    return '';
  }
}

function formatMessageTime(iso: string): string {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

/* ---------- types ---------- */

type ConversationWithMeta = ChatConversation & {
  otherParticipant: Profile | null;
  lastMessage: ChatMessage | null;
};

/* ---------- main content ---------- */

function ChatPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const conversationId = searchParams.get('id');

  const [conversations, setConversations] = useState<ConversationWithMeta[]>([]);
  const [convLoading, setConvLoading] = useState(true);

  const [activeConversation, setActiveConversation] = useState<ConversationWithMeta | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);

  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const channelRef = useRef<any>(null);

  /* ----- redirect to /login if no user (after auth resolves) ----- */
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login');
    }
  }, [authLoading, user, router]);

  /* ----- load conversations for the user ----- */
  const loadConversations = useCallback(async () => {
    if (!user) return;
    setConvLoading(true);
    try {
      const { data: convRows, error } = await supabase
        .from('chat_conversations')
        .select('*')
        .or(`participant1_id.eq.${user.id},participant2_id.eq.${user.id}`)
        .order('last_message_at', { ascending: false });

      if (error) throw error;

      const rows = (convRows as ChatConversation[]) ?? [];
      const otherIds = rows
        .map((c) => (c.participant1_id === user.id ? c.participant2_id : c.participant1_id))
        .filter((id, idx, arr) => id && arr.indexOf(id) === idx);

      const profileMap: Record<string, Profile> = {};
      if (otherIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('*')
          .in('id', otherIds);
        (profiles as Profile[] | null)?.forEach((p) => {
          if (p) profileMap[p.id] = p;
        });
      }

      const convIds = rows.map((r) => r.id);
      const lastMessageMap: Record<string, ChatMessage> = {};
      if (convIds.length > 0) {
        const { data: lastMsgs } = await supabase
          .from('chat_messages')
          .select('*')
          .in('conversation_id', convIds)
          .order('created_at', { ascending: false })
          .limit(100);
        (lastMsgs as ChatMessage[] | null)?.forEach((m) => {
          if (m && !lastMessageMap[m.conversation_id]) {
            lastMessageMap[m.conversation_id] = m;
          }
        });
      }

      const enriched: ConversationWithMeta[] = rows.map((c) => {
        const otherId = c.participant1_id === user.id ? c.participant2_id : c.participant1_id;
        return {
          ...c,
          otherParticipant: profileMap[otherId] ?? null,
          lastMessage: lastMessageMap[c.id] ?? null,
        };
      });

      setConversations(enriched);

      // keep active conversation meta fresh
      if (conversationId) {
        const active = enriched.find((c) => c.id === conversationId) ?? null;
        setActiveConversation((prev) => active ?? prev);
      }
    } catch (err) {
      console.error('Failed to load conversations:', err);
      toast.error('Could not load your conversations.');
    } finally {
      setConvLoading(false);
    }
  }, [user, conversationId]);

  useEffect(() => {
    if (user) loadConversations();
  }, [user, loadConversations]);

  /* ----- load messages for the active conversation ----- */
  const loadMessages = useCallback(
    async (silent = false) => {
      if (!conversationId) {
        setMessages([]);
        return;
      }
      if (!silent) setMessagesLoading(true);
      try {
        const { data, error } = await supabase
          .from('chat_messages')
          .select('*')
          .eq('conversation_id', conversationId)
          .order('created_at', { ascending: true });

        if (error) throw error;
        setMessages((data as ChatMessage[]) ?? []);
      } catch (err) {
        console.error('Failed to load messages:', err);
        if (!silent) toast.error('Could not load messages.');
      } finally {
        if (!silent) setMessagesLoading(false);
      }
    },
    [conversationId],
  );

  /* ----- resolve the active conversation object when id changes ----- */
  useEffect(() => {
    if (!conversationId) {
      setActiveConversation(null);
      setMessages([]);
      return;
    }
    // try to use already-loaded meta; otherwise fetch directly
    const fromList = conversations.find((c) => c.id === conversationId) ?? null;
    if (fromList) {
      setActiveConversation(fromList);
    } else {
      (async () => {
        try {
          const { data } = await supabase
            .from('chat_conversations')
            .select('*')
            .eq('id', conversationId)
            .maybeSingle();
          const row = data as ChatConversation | null;
          if (row && user) {
            const otherId =
              row.participant1_id === user.id ? row.participant2_id : row.participant1_id;
            const { data: prof } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', otherId)
              .maybeSingle();
            setActiveConversation({
              ...row,
              otherParticipant: (prof as Profile) ?? null,
              lastMessage: null,
            });
          } else {
            setActiveConversation(null);
          }
        } catch {
          setActiveConversation(null);
        }
      })();
    }
    loadMessages(false);
  }, [conversationId, conversations, user, loadMessages]);

  /* ----- realtime subscription + 3s polling fallback for new messages ----- */
  useEffect(() => {
    if (!conversationId) return;

    // realtime channel
    try {
      channelRef.current = supabase
        .channel(`chat_messages:conversation_id=eq.${conversationId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'chat_messages',
            filter: `conversation_id=eq.${conversationId}`,
          },
          (payload: any) => {
            const incoming = payload.new as ChatMessage;
            setMessages((prev) => {
              if (prev.some((m) => m.id === incoming.id)) return prev;
              return [...prev, incoming];
            });
          },
        )
        .subscribe();
    } catch (err) {
      console.error('Realtime subscription failed, relying on polling:', err);
    }

    // polling fallback every 3s
    pollRef.current = setInterval(() => {
      loadMessages(true);
    }, 3000);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      pollRef.current = null;
      if (channelRef.current) {
        try {
          supabase.removeChannel(channelRef.current);
        } catch {
          /* noop */
        }
        channelRef.current = null;
      }
    };
  }, [conversationId, loadMessages]);

  /* ----- auto-scroll to bottom on new messages ----- */
  useEffect(() => {
    if (!conversationId) return;
    const el = messagesEndRef.current;
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, conversationId]);

  /* ----- send a message ----- */
  const handleSend = async () => {
    const text = draft.trim();
    if (!text || !user || !conversationId) return;
    setSending(true);
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .insert({
          conversation_id: conversationId,
          sender_id: user.id,
          message: text,
          read: false,
        })
        .select('*')
        .single();

      if (error) throw error;

      const created = data as ChatMessage;
      setMessages((prev) => (prev.some((m) => m.id === created.id) ? prev : [...prev, created]));
      setDraft('');

      // bump conversation last_message_at locally + in DB
      await supabase
        .from('chat_conversations')
        .update({ last_message_at: created.created_at, updated_at: new Date().toISOString() })
        .eq('id', conversationId);

      setActiveConversation((prev) =>
        prev ? { ...prev, lastMessage: created, last_message_at: created.created_at } : prev,
      );
      setConversations((prev) =>
        prev
          .map((c) =>
            c.id === conversationId
              ? { ...c, lastMessage: created, last_message_at: created.created_at }
              : c,
          )
          .sort((a, b) =>
            (b.last_message_at ?? b.updated_at ?? '').localeCompare(
              a.last_message_at ?? a.updated_at ?? '',
            ),
          ),
      );
    } catch (err) {
      console.error('Failed to send message:', err);
      toast.error('Could not send message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const openConversation = (id: string) => {
    router.push(`/chat?id=${id}`);
  };

  const backToList = () => {
    router.push('/chat');
  };

  /* ---------- loading / auth gate ---------- */
  if (authLoading) {
    return (
      <>
        <Navbar />
        <main className="container-page flex min-h-[60vh] items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </main>
        <Footer />
      </>
    );
  }

  if (!user) {
    // redirect in flight
    return (
      <>
        <Navbar />
        <main className="container-page flex min-h-[60vh] items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </main>
        <Footer />
      </>
    );
  }

  const otherName = activeConversation ? fullName(activeConversation.otherParticipant) : '';

  /* ---------- render ---------- */
  return (
    <>
      <Navbar />
      <main className="container-page py-6">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-bold sm:text-3xl">Messages</h1>
            <p className="text-sm text-muted-foreground">
              Chat with vendors and customers about orders and products.
            </p>
          </div>
        </div>

        <div className="grid h-[calc(100vh-260px)] min-h-[480px] grid-cols-1 overflow-hidden rounded-xl border bg-white shadow-sm md:grid-cols-[320px_1fr]">
          {/* ============ Conversation list ============ */}
          <aside
            className={cn(
              'flex flex-col border-r',
              conversationId ? 'hidden md:flex' : 'flex',
            )}
          >
            <div className="border-b px-4 py-3">
              <h2 className="font-display text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Conversations
              </h2>
            </div>

            <div className="flex-1 overflow-y-auto">
              {convLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : conversations.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                    <MessageCircle className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-medium">No conversations yet</p>
                    <p className="text-sm text-muted-foreground">
                      When you start a chat with a vendor, it will appear here.
                    </p>
                  </div>
                </div>
              ) : (
                <ul className="divide-y">
                  {conversations.map((c) => {
                    const name = fullName(c.otherParticipant);
                    const isActive = c.id === conversationId;
                    return (
                      <li key={c.id}>
                        <button
                          type="button"
                          onClick={() => openConversation(c.id)}
                          className={cn(
                            'flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-accent',
                            isActive && 'bg-accent',
                          )}
                        >
                          <Avatar className="h-10 w-10">
                            <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
                              {initials(name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-2">
                              <span className="truncate text-sm font-medium">{name}</span>
                              <span className="shrink-0 text-xs text-muted-foreground">
                                {c.lastMessage
                                  ? formatTime(c.lastMessage.created_at)
                                  : formatTime(c.last_message_at ?? c.updated_at)}
                              </span>
                            </div>
                            <p className="truncate text-xs text-muted-foreground">
                              {c.lastMessage
                                ? c.lastMessage.sender_id === user.id
                                  ? `You: ${c.lastMessage.message}`
                                  : c.lastMessage.message
                                : 'No messages yet'}
                            </p>
                          </div>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </aside>

          {/* ============ Active conversation / messages ============ */}
          <section
            className={cn(
              'flex flex-col',
              conversationId ? 'flex' : 'hidden md:flex',
            )}
          >
            {conversationId ? (
              <>
                {/* header */}
                <div className="flex items-center gap-3 border-b px-4 py-3">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="md:hidden"
                    onClick={backToList}
                    aria-label="Back to conversations"
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </Button>
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
                      {initials(otherName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{otherName}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {activeConversation?.otherParticipant?.email ?? ''}
                    </p>
                  </div>
                </div>

                {/* messages */}
                <div
                  ref={messagesContainerRef}
                  className="flex-1 space-y-3 overflow-y-auto bg-muted/20 px-4 py-4"
                >
                  {messagesLoading ? (
                    <div className="flex h-full items-center justify-center">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                        <MessageCircle className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-medium">No messages yet</p>
                        <p className="text-sm text-muted-foreground">
                          Send the first message to start the conversation.
                        </p>
                      </div>
                    </div>
                  ) : (
                    messages.map((m) => {
                      const isMine = m.sender_id === user.id;
                      return (
                        <div
                          key={m.id}
                          className={cn('flex', isMine ? 'justify-end' : 'justify-start')}
                        >
                          <div
                            className={cn(
                              'max-w-[78%] rounded-2xl px-3.5 py-2 text-sm shadow-sm sm:max-w-[70%]',
                              isMine
                                ? 'rounded-br-md bg-primary text-primary-foreground'
                                : 'rounded-bl-md bg-white text-foreground border',
                            )}
                          >
                            <p className="whitespace-pre-wrap break-words">{m.message}</p>
                            <p
                              className={cn(
                                'mt-1 text-right text-[10px]',
                                isMine ? 'text-primary-foreground/70' : 'text-muted-foreground',
                              )}
                            >
                              {formatMessageTime(m.created_at)}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* input */}
                <div className="border-t bg-white px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Input
                      type="text"
                      placeholder="Type a message..."
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      onKeyDown={onKeyDown}
                      disabled={sending}
                      className="flex-1"
                      autoComplete="off"
                    />
                    <Button
                      type="button"
                      size="icon"
                      onClick={handleSend}
                      disabled={sending || !draft.trim()}
                      aria-label="Send message"
                    >
                      {sending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              /* No conversation selected — placeholder */
              <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
                  <MessageCircle className="h-7 w-7 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-lg font-medium">Select a conversation</p>
                  <p className="text-sm text-muted-foreground">
                    Choose a conversation from the list to view messages, or start chatting with a
                    vendor from a product page.
                  </p>
                </div>
                <Button asChild variant="outline" className="mt-2">
                  <Link href="/">Browse products</Link>
                </Button>
              </div>
            )}
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}

export default function ChatPage() {
  return (
    <Suspense
      fallback={
        <>
          <Navbar />
          <main className="container-page flex min-h-[60vh] items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </main>
          <Footer />
        </>
      }
    >
      <ChatPageContent />
    </Suspense>
  );
}
