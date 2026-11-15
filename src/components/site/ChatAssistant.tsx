import { MessageCircle, Send, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Message = { role: "user" | "assistant"; content: string };

const GREETING: Message = {
  role: "assistant",
  content:
    "Hey! I'm Intellectual Mindset. Ask me about our clothing, prices, sizing, orders or custom requests.",
};

export function ChatAssistant() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([GREETING]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, open]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || busy) return;

    const next = [...messages, { role: "user" as const, content: text }];
    setMessages([...next, { role: "assistant", content: "" }]);
    setInput("");
    setBusy(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next.filter((m) => m.content.trim()) }),
      });

      if (!response.ok || !response.body) {
        throw new Error(await response.text());
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let acc = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        setMessages([...next, { role: "assistant", content: acc }]);
      }
      if (!acc.trim()) {
        setMessages([
          ...next,
          { role: "assistant", content: "Sorry, I couldn't answer that. Please try again." },
        ]);
      }
    } catch {
      setMessages([
        ...next,
        {
          role: "assistant",
          content: "I'm having trouble right now. Please try again in a moment.",
        },
      ]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      {open ? (
        <div className="fixed bottom-4 right-4 z-50 flex h-[28rem] w-[min(22rem,calc(100vw-2rem))] flex-col border border-border bg-card shadow-xl">
          <div className="flex items-center justify-between bg-ink px-4 py-3 text-ink-foreground">
            <div>
              <p className="label-tag text-lime">Intellectual Mindset</p>
              <p className="text-[11px] text-ink-foreground/60">Brand assistant</p>
            </div>
            <button type="button" aria-label="Close chat" onClick={() => setOpen(false)}>
              <X className="size-4" />
            </button>
          </div>

          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-4">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`max-w-[85%] px-3 py-2 text-sm ${
                  m.role === "user"
                    ? "ml-auto bg-ink text-ink-foreground"
                    : "border border-border bg-background text-foreground"
                }`}
              >
                {m.content || (busy ? "Typing…" : "")}
              </div>
            ))}
          </div>

          <form onSubmit={send} className="flex items-center gap-2 border-t border-border p-3">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about products, sizing, orders…"
              className="flex-1"
            />
            <Button
              type="submit"
              size="icon"
              disabled={busy}
              className="bg-lime text-lime-foreground hover:bg-lime/90"
            >
              <Send className="size-4" />
            </Button>
          </form>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="fixed bottom-4 right-4 z-50 flex items-center gap-2 bg-ink px-4 py-3 text-ink-foreground shadow-xl hover:bg-ink/90"
        >
          <MessageCircle className="size-4 text-lime" />
          <span className="label-tag">Ask us</span>
        </button>
      )}
    </>
  );
}
