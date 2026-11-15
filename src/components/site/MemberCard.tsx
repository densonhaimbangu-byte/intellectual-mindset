import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import {
  formatCardNumber,
  maskCardNumber,
  pointsValue,
  type MemberCardRecord,
} from "@/lib/cards";

import { formatPrice } from "@/lib/store";

export function MemberCard({
  card,
  showSecrets = false,
}: {
  card: MemberCardRecord;
  showSecrets?: boolean;
}) {
  const [reveal, setReveal] = useState(showSecrets);

  return (
    <div className="relative aspect-[1.586/1] w-full max-w-sm overflow-hidden border border-white/15 bg-ink p-5 text-ink-foreground shadow-lg">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-16 -top-16 size-48 rounded-full bg-lime/15 blur-2xl"
      />

      <div className="flex items-start justify-between">
        <div>
          <p className="display-xl text-xl leading-none">
            Intellectual<span className="text-lime">Mindset</span>
          </p>
          <p className="label-tag mt-1 text-[10px] text-lime">Discount card</p>
        </div>
        <button
          type="button"
          onClick={() => setReveal((v) => !v)}
          aria-label={reveal ? "Hide card details" : "Show card details"}
          className="text-ink-foreground/60 hover:text-lime"
        >
          {reveal ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      </div>

      <p className="mt-6 font-mono text-base tracking-[0.18em] sm:text-lg">
        {reveal ? formatCardNumber(card.card_number) : maskCardNumber(card.card_number)}
      </p>

      <div className="mt-4 flex items-end justify-between gap-3">
        <div>
          <p className="label-tag text-[10px] text-ink-foreground/50">Card holder</p>
          <p className="text-sm uppercase">{card.card_title}</p>
          <p className="text-xs text-ink-foreground/60">{card.full_name}</p>
          <p className="label-tag mt-2 text-[10px] text-ink-foreground/50">Points</p>
          <p className="text-sm">
            {Number(card.points ?? 0)}{" "}
            <span className="text-ink-foreground/60">
              ({formatPrice(pointsValue(Number(card.points ?? 0)))})
            </span>
          </p>
        </div>
        <div className="text-right">
          <p className="label-tag text-[10px] text-ink-foreground/50">CVV</p>
          <p className="font-mono text-sm">{reveal ? card.cvv : "•••"}</p>
          <p className="label-tag mt-2 text-[10px] text-ink-foreground/50">Balance</p>
          <p className="text-lg text-lime">{formatPrice(Number(card.balance))}</p>
        </div>
      </div>

    </div>
  );
}
