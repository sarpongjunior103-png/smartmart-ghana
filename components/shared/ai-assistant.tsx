// @ts-nocheck
'use client'

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Sparkles, Send, X, Loader2, ShoppingBag, Star } from 'lucide-react';
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
}

const SUGGESTED_PROMPTS = [
  'Recommend electronics under GH₵500',
  'Show me featured products',
  'I\'m looking for a phone',
  'Compare products for me',
];

export function AIAssistant() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<AIMessage[]>([
    {
      role: 'assistant',
      content: 'Hello! I\'m your AI shopping assistant. I can help you find products, compare options, and get recommendations. What are you looking for today?',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const handleSend = async (text?: string) => {
    const messageText = text ?? input;
    if (!messageText.trim() || loading) return;

    const userMessage: AIMessage = { role: 'user', content: messageText };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/ai-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: messageText }),
      });
      const data = await res.json();

      if (data.error) {
        setMessages((prev) => [...prev, { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' }]);
      } else {
        setMessages((prev) => [...prev, {
          role: 'assistant',
          content: data.response,
          recommendations: data.recommendations,
        }]);
      }
    } catch {
      setMessages((prev) => [...prev, { role: 'assistant', content: 'Sorry, I couldn\'t connect. Please try again.' }]);
    }
    setLoading(false);
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
    <div className="fixed bottom-6 right-6 z-50 w-[calc(100vw-3rem)] sm:w-96 max-h-[600px] flex flex-col">
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
                <span className="h-1.5 w-1.5 rounded-full bg-green-400" /> Online
              </p>
            </div>
          </div>
          <button onClick={() => setOpen(false)} className="rounded-lg p-1.5 hover:bg-white/10 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-muted/30 min-h-[300px] max-h-[400px]">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
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
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-background border rounded-2xl px-4 py-3 flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                <span className="text-sm text-muted-foreground">Thinking...</span>
              </div>
            </div>
          )}
        </div>

        {/* Suggested prompts */}
        {messages.length <= 1 && (
          <div className="px-4 pb-2 flex flex-wrap gap-2">
            {SUGGESTED_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                onClick={() => handleSend(prompt)}
                className="rounded-full border bg-background px-3 py-1.5 text-xs text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
              >
                {prompt}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <div className="border-t p-3 flex gap-2 bg-background">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask me anything about products..."
            className="flex-1 rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            disabled={loading}
          />
          <Button
            size="icon"
            onClick={() => handleSend()}
            disabled={loading || !input.trim()}
            className="shrink-0"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </Card>
    </div>
  );
}
