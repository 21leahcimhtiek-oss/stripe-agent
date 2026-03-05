import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, Send, Trash2, MessageSquare, Bot, User, Loader2, Wrench } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { Streamdown } from "streamdown";
import { toast } from "sonner";

function formatTime(date: Date) {
  return new Date(date).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
}

export default function Chat() {
  const params = useParams<{ sessionId?: string }>();
  const [, setLocation] = useLocation();
  const [input, setInput] = useState("");
  const [activeSessionId, setActiveSessionId] = useState<number | null>(
    params.sessionId ? parseInt(params.sessionId) : null
  );
  const [isThinking, setIsThinking] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const utils = trpc.useUtils();
  const { data: sessions, isLoading: sessionsLoading } = trpc.chat.getSessions.useQuery();
  const { data: messages, isLoading: messagesLoading } = trpc.chat.getMessages.useQuery(
    { sessionId: activeSessionId! },
    { enabled: !!activeSessionId }
  );

  const createSession = trpc.chat.createSession.useMutation({
    onSuccess: (session) => {
      utils.chat.getSessions.invalidate();
      setActiveSessionId(session.id);
      setLocation(`/chat/${session.id}`);
    },
  });

  const deleteSession = trpc.chat.deleteSession.useMutation({
    onSuccess: () => {
      utils.chat.getSessions.invalidate();
      setActiveSessionId(null);
      setLocation("/chat");
    },
  });

  const sendMessage = trpc.agent.chat.useMutation({
    onSuccess: () => {
      utils.chat.getMessages.invalidate({ sessionId: activeSessionId! });
      utils.chat.getSessions.invalidate();
      setIsThinking(false);
    },
    onError: (err) => {
      setIsThinking(false);
      toast.error("Agent error: " + err.message);
    },
  });

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isThinking]);

  // Handle prompt from URL query params (from Dashboard quick actions)
  useEffect(() => {
    const url = new URL(window.location.href);
    const prompt = url.searchParams.get("prompt");
    if (prompt && !activeSessionId) {
      handleNewSession(prompt);
      // Clean URL
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  async function handleNewSession(initialMessage?: string) {
    const session = await createSession.mutateAsync({});
    if (initialMessage && session) {
      setInput(initialMessage);
      setTimeout(() => {
        handleSend(session.id, initialMessage);
      }, 100);
    }
  }

  async function handleSend(sessionId?: number, messageOverride?: string) {
    const sid = sessionId ?? activeSessionId;
    const msg = messageOverride ?? input.trim();
    if (!sid || !msg) return;

    setInput("");
    setIsThinking(true);
    sendMessage.mutate({ sessionId: sid, message: msg });
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!activeSessionId) {
        handleNewSession(input.trim());
        setInput("");
      } else {
        handleSend();
      }
    }
  }

  const visibleMessages = messages?.filter(m => m.role !== "tool") ?? [];

  return (
    <div className="flex h-[calc(100vh-6rem)] gap-4">
      {/* Sidebar: Session List */}
      <div className="w-64 shrink-0 flex flex-col gap-2">
        <Button
          onClick={() => handleNewSession()}
          className="w-full gap-2"
          disabled={createSession.isPending}
        >
          <Plus className="h-4 w-4" />
          New Conversation
        </Button>

        <ScrollArea className="flex-1">
          <div className="space-y-1 pr-1">
            {sessionsLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map(i => <div key={i} className="h-12 bg-muted/50 rounded animate-pulse" />)}
              </div>
            ) : sessions?.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-30" />
                No conversations yet
              </div>
            ) : (
              sessions?.map(session => (
                <div
                  key={session.id}
                  className={`group flex items-center gap-2 px-3 py-2.5 rounded-lg cursor-pointer transition-colors ${
                    activeSessionId === session.id
                      ? "bg-primary/15 text-foreground"
                      : "hover:bg-muted/50 text-muted-foreground hover:text-foreground"
                  }`}
                  onClick={() => {
                    setActiveSessionId(session.id);
                    setLocation(`/chat/${session.id}`);
                  }}
                >
                  <MessageSquare className="h-3.5 w-3.5 shrink-0" />
                  <span className="text-xs truncate flex-1">{session.title}</span>
                  <button
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 hover:text-destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteSession.mutate({ sessionId: session.id });
                    }}
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-card rounded-xl border border-border overflow-hidden">
        {!activeSessionId ? (
          /* Welcome Screen */
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <div className="h-16 w-16 rounded-2xl bg-primary/15 flex items-center justify-center mb-4">
              <Bot className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-xl font-semibold text-foreground mb-2">StripeAgent</h2>
            <p className="text-muted-foreground text-sm max-w-sm mb-6">
              Manage your entire Stripe account through natural language. Create customers, manage subscriptions, process refunds, and more.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-md">
              {[
                "List all my customers",
                "Show active subscriptions",
                "What's my current balance?",
                "Create a product called Pro Plan at $29/month",
                "Show recent invoices",
                "List all my products",
              ].map(suggestion => (
                <button
                  key={suggestion}
                  className="text-left px-3 py-2.5 rounded-lg border border-border bg-muted/30 hover:bg-muted/60 text-sm text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => {
                    handleNewSession(suggestion);
                  }}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4 max-w-3xl mx-auto">
                {messagesLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                ) : visibleMessages.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    Send a message to start the conversation
                  </div>
                ) : (
                  visibleMessages.map(msg => (
                    <div
                      key={msg.id}
                      className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
                    >
                      <div className={`h-7 w-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                        msg.role === "user" ? "bg-primary/20" : "bg-muted"
                      }`}>
                        {msg.role === "user" ? (
                          <User className="h-3.5 w-3.5 text-primary" />
                        ) : (
                          <Bot className="h-3.5 w-3.5 text-muted-foreground" />
                        )}
                      </div>
                      <div className={`flex flex-col gap-1 max-w-[80%] ${msg.role === "user" ? "items-end" : "items-start"}`}>
                        <div className={`rounded-xl px-4 py-2.5 text-sm ${
                          msg.role === "user"
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted/50 text-foreground"
                        }`}>
                          {msg.role === "user" ? (
                            <p className="whitespace-pre-wrap">{msg.content}</p>
                          ) : (
                            <div className="prose prose-sm prose-invert max-w-none [&_table]:w-full [&_table]:text-xs [&_th]:text-left [&_th]:pb-1 [&_td]:py-0.5">
                              <Streamdown>{msg.content}</Streamdown>
                            </div>
                          )}
                        </div>
                        <span className="text-[10px] text-muted-foreground px-1">
                          {formatTime(msg.createdAt)}
                        </span>
                      </div>
                    </div>
                  ))
                )}

                {/* Thinking indicator */}
                {isThinking && (
                  <div className="flex gap-3">
                    <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center shrink-0">
                      <Bot className="h-3.5 w-3.5 text-muted-foreground" />
                    </div>
                    <div className="bg-muted/50 rounded-xl px-4 py-3 flex items-center gap-2">
                      <Wrench className="h-3.5 w-3.5 text-primary animate-pulse" />
                      <span className="text-sm text-muted-foreground">Executing Stripe operations...</span>
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                    </div>
                  </div>
                )}

                <div ref={bottomRef} />
              </div>
            </ScrollArea>

            {/* Input */}
            <div className="p-4 border-t border-border">
              <div className="flex gap-2 max-w-3xl mx-auto">
                <Input
                  ref={inputRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask me anything about your Stripe account..."
                  className="flex-1 bg-muted/30 border-border"
                  disabled={isThinking || sendMessage.isPending}
                />
                <Button
                  onClick={() => handleSend()}
                  disabled={!input.trim() || isThinking || sendMessage.isPending}
                  size="icon"
                >
                  {isThinking ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-[10px] text-muted-foreground text-center mt-2">
                StripeAgent can create, update, and delete Stripe resources. Always review before confirming destructive actions.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
