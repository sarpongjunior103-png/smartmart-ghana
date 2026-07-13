// @ts-nocheck
'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Sparkles, Send, X, ShoppingBag, Star, Search, Tag,
  Truck, RotateCcw, CreditCard, Store, Headphones, Package,
  RefreshCw, ChevronDown, Trash2,
} from 'lucide-react';
import { formatPrice, getEffectivePrice } from '@/lib/constants';

interface AIMessage {
  role: 'user' | 'assistant';
  content: string;
  recommendations?: Array<{
    id: string;
    name: string;
    price: number;
    discount_price: number | null;
    image_url: string | null;
    rating: number;
    brand: string | null;
    stock: number;
  }>;
  intent?: string;
  timestamp: number;
}

const QUICK_ACTIONS = [
  { label: 'Search Products', icon: Search, prompt: 'Show me featured products', color: 'text-blue-500' },
  { label: 'Track Order', icon: Package, prompt: 'Track my recent order', color: 'text-green-500' },
  { label: 'Shipping Info', icon: Truck, prompt: 'What are your shipping options?', color: 'text-amber-500' },
  { label: 'Returns', icon: RotateCcw, prompt: 'What is your return policy?', color: 'text-orange-500' },
  { label: 'Payment Help', icon: CreditCard, prompt: 'What payment methods do you accept?', color: 'text-purple-500' },
  { label: 'Become a Seller', icon: Store, prompt: 'How do I become a seller?', color: 'text-cyan-500' },
  { label: 'Support', icon: Headphones, prompt: 'I need to contact customer support', color: 'text-red-500' },
  { label: 'Discounts', icon: Tag, prompt: 'Which products are on discount?', color: 'text-pink-500' },
];

const SUGGESTED_PROMPTS = [
  'Show me phones under GHS 3,000',
  'Recommend the best laptops for students',
  'Compare Samsung and iPhone',
  'Which products are on discount?',
];

const GREETING: AIMessage = {
  role: 'assistant',
  content: "Hello! I'm your SmartMart AI shopping assistant. I can help you find products, compare options, track orders, and answer questions about shipping, returns, and payments. What can I help you with today?",
  timestamp: Date.now(),
};

export function AIAssistant() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<AIMessage[]>([GREETING]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [errorCount, setErrorCount] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
  }, [open]);

  const handleSend = useCallback(async (text?: string) => {
    const messageText = text ?? input;
    if (!messageText.trim() || loading) return;

    const userMessage: AIMessage = {
      role: 'user',
      content: messageText,
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);
    setShowQuickActions(false);

    try {
      const res = await fetch('/api/ai-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: messageText }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();

      if (data.error) {
        throw new Error(data.error);
      }

      setMessages((prev) => [...prev, {
        role: 'assistant',
        content: data.response,
        recommendations: data.recommendations,
        intent: data.intent,
        timestamp: Date.now(),
      }]);
      setErrorCount(0);
    } catch (err) {
      setErrorCount((c) => c + 1);
      const friendlyMessages = [
        "I'm having trouble connecting right now. Please try again in a moment.",
        "It seems there's a connection issue. Could you try sending that again?",
        "I apologize — I'm experiencing technical difficulties. Please retry, or contact our support team if the issue persists.",
      ];
      const msgIndex = Math.min(errorCount, friendlyMessages.length - 1);
      setMessages((prev) => [...prev, {
        role: 'assistant',
        content: friendlyMessages[msgIndex],
        timestamp: Date.now(),
      }]);
    } finally {
      setLoading(false);
    }
  }, [input, loading, errorCount]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleClearChat = () => {
    setMessages([GREETING]);
    setErrorCount(0);
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-lg hover:shadow-xl transition-all hover:scale-105 group"
        aria-label="Open AI Assistant"
      >
        <Sparkles className="h-6 w-6 group-hover:rotate-12 transition-transform" />
        <span className="absolute -top-1 -right-1 flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500" />
        </span>
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 w-[calc(100vw-3rem)] sm:w-96 max-h-[600px] flex flex-col animate-in slide-in-from-bottom-2 duration-200">
      <Card className="flex flex-col shadow-2xl overflow-hidden border-primary/20">
        {/* Header */}
        <div className="flex items-center justify-between bg-gradient-to-r from-primary to-primary/80 p-4 text-primary-foreground">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <p className="font-semibold text-sm">AI Shopping Assistant</p>
              <p className="text-xs text-primary-foreground/70 flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" /> Online
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={handleClearChat}
              className="rounded-lg p-1.5 hover:bg-white/10 transition-colors"
              aria-label="Clear conversation"
              title="Clear conversation"
            >
              <Trash2 className="h-4 w-4" />
            </button>
            <button
              onClick={() => setOpen(false)}
              className="rounded-lg p-1.5 hover:bg-white/10 transition-colors"
              aria-label="Close assistant"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-muted/30 min-h-[300px] max-h-[400px]">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-1 duration-300`}
            >
              <div className={`max-w-[85%] ${msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-background border'} rounded-2xl px-4 py-2.5`}>
                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                {msg.recommendations && msg.recommendations.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {msg.recommendations.map((p) => (
                      <Link
                        key={p.id}
                        href={`/products/${p.id}`}
                        onClick={() => setOpen(false)}
                        className="flex items-center gap-2 rounded-lg border bg-card p-2 hover:bg-accent transition-colors"
                      >
                        <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-muted">
                          {p.image_url && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={p.image_url} alt="" className="h-full w-full object-cover" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium truncate">{p.name}</p>
                          <div className="flex items-center gap-1">
                            <p className="text-xs font-bold text-primary">{formatPrice(getEffectivePrice(p))}</p>
                            {p.rating > 0 && (
                              <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
                                <Star className="h-3 w-3 fill-amber-400 text-amber-400" />{p.rating}
                              </span>
                            )}
                          </div>
                        </div>
                        <ShoppingBag className="h-4 w-4 text-muted-foreground shrink-0" />
                      </Link>
                    ))}
                  </div>
                )}
                <p className="text-[10px] text-muted-foreground/50 mt-1 text-right">
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))}

          {/* Typing indicator */}
          {loading && (
            <div className="flex justify-start animate-in fade-in duration-200">
              <div className="bg-background border rounded-2xl px-4 py-3 flex items-center gap-2">
                <div className="flex gap-1">
                  <span className="h-2 w-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="h-2 w-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="h-2 w-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <span className="text-sm text-muted-foreground">Thinking...</span>
              </div>
            </div>
          )}
        </div>

        {/* Suggested prompts (show on first message only) */}
        {messages.length <= 1 && !loading && (
          <div className="px-4 pb-2 flex flex-wrap gap-2">
            {SUGGESTED_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                onClick={() => handleSend(prompt)}
                className="rounded-full border bg-background px-3 py-1.5 text-xs text-muted-foreground hover:bg-accent hover:text-foreground hover:border-primary/30 transition-all"
              >
                {prompt}
              </button>
            ))}
          </div>
        )}

        {/* Quick action buttons toggle */}
        {messages.length > 1 && !loading && (
          <div className="px-4 pb-1">
            <button
              onClick={() => setShowQuickActions(!showQuickActions)}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <ChevronDown className={`h-3 w-3 transition-transform ${showQuickActions ? 'rotate-180' : ''}`} />
              Quick actions
            </button>
          </div>
        )}

        {/* Quick action buttons */}
        {showQuickActions && !loading && (
          <div className="px-4 pb-2 grid grid-cols-2 gap-1.5 animate-in slide-in-from-top-1 duration-200">
            {QUICK_ACTIONS.map((action) => (
              <button
                key={action.label}
                onClick={() => {
                  handleSend(action.prompt);
                  setShowQuickActions(false);
                }}
                className="flex items-center gap-1.5 rounded-lg border bg-background px-2 py-1.5 text-xs hover:bg-accent transition-colors"
              >
                <action.icon className={`h-3.5 w-3.5 ${action.color}`} />
                <span className="truncate">{action.label}</span>
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <div className="border-t p-3 flex gap-2 bg-background">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask me anything about products..."
            className="flex-1 rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
            disabled={loading}
          />
          <Button
            size="icon"
            onClick={() => handleSend()}
            disabled={loading || !input.trim()}
            className="shrink-0"
          >
            {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      </Card>
    </div>
  );
}
