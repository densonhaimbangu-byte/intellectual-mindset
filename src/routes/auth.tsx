import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Eye, EyeOff, FileText, MailCheck, ShoppingBag, Stamp } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Customer Login & Order Slips | Intellectual Mindset" },
      {
        name: "description",
        content:
          "Sign in to view your Intellectual Mindset orders and save your branded order slips.",
      },
      { property: "og:title", content: "Your Intellectual Mindset orders" },
      {
        property: "og:description",
        content: "Create your account to keep your clothing orders together.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Auth,
});

async function routeAfterLogin() {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return "/auth" as const;
  const { data: isAdmin } = await supabase.rpc("has_role", {
    _user_id: userData.user.id,
    _role: "admin",
  });
  return isAdmin ? ("/dashboard" as const) : ("/orders" as const);
}

function Auth() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [verifySent, setVerifySent] = useState(false);
  const [showPw, setShowPw] = useState(false);

  useEffect(() => {
    void (async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) return;
      const to = await routeAfterLogin();
      navigate({ to, replace: true });
    })();
  }, [navigate]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { full_name: fullName, phone },
          },
        });
        if (error) throw error;
        if (!data.session) {
          setVerifySent(true);
          toast.success("Check your email to verify your account");
          return;
        }
      }
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;

      const to = await routeAfterLogin();
      navigate({ to, replace: true });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not sign in");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid min-h-screen bg-ink text-ink-foreground lg:grid-cols-2">
      <div className="hidden flex-col justify-center gap-6 border-r border-white/10 p-12 lg:flex">
        <p className="display-xl text-5xl leading-none">
          Your orders.<br />
          <span className="text-lime">Intellectual Mindset</span>
          <br />
          Your brand.
        </p>
        <ul className="space-y-4 text-sm text-ink-foreground/70">
          <li className="flex items-start gap-3">
            <FileText className="mt-0.5 size-4 text-lime" />
            Your clothing orders, all in one place.
          </li>
          <li className="flex items-start gap-3">
            <Stamp className="mt-0.5 size-4 text-lime" />
            Brand-stamped order slips.
          </li>
          <li className="flex items-start gap-3">
            <ShoppingBag className="mt-0.5 size-4 text-lime" />
            Hoodies, tees, socks and stickers.
          </li>
        </ul>
      </div>

      <div className="flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm border border-white/10 p-8">
          <p className="display-xl text-3xl">
            Intellectual<span className="text-lime">Mindset</span>
          </p>
          <p className="label-tag mt-2 text-lime">
            {mode === "signin" ? "Customer login" : "Create an account"}
          </p>

          <form onSubmit={onSubmit} className="mt-8 space-y-4">
            {mode === "signup" ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="fullName" className="label-tag">
                    Full name
                  </Label>
                  <Input
                    id="fullName"
                    required
                    autoComplete="name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="border-white/20 bg-transparent text-ink-foreground"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone" className="label-tag">
                    Phone
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    autoComplete="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="border-white/20 bg-transparent text-ink-foreground"
                  />
                </div>
              </>
            ) : null}

            <div className="space-y-2">
              <Label htmlFor="email" className="label-tag">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="border-white/20 bg-transparent text-ink-foreground"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="label-tag">
                Password
              </Label>
              <div className="relative">
              <Input
                id="password"
                type={showPw ? "text" : "password"}
                required
                minLength={6}
                autoComplete={mode === "signup" ? "new-password" : "current-password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="border-white/20 bg-transparent pr-10 text-ink-foreground"
              />
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                aria-label={showPw ? "Hide password" : "Show password"}
                className="absolute inset-y-0 right-0 flex items-center px-3 text-ink-foreground/60 hover:text-ink-foreground"
              >
                {showPw ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
              </div>
            </div>
            <Button
              type="submit"
              disabled={busy}
              className="w-full bg-lime text-lime-foreground hover:bg-lime/90"
            >
              {busy
                ? "Please wait…"
                : mode === "signup"
                  ? "Create account"
                  : "Sign in"}
            </Button>
          </form>

          {verifySent ? (
            <p className="mt-4 flex items-start gap-2 border border-lime/40 p-3 text-xs text-ink-foreground/80">
              <MailCheck className="mt-0.5 size-4 shrink-0 text-lime" />
              We sent a verification link to {email}. Click it to activate your account, then sign
              in.
            </p>
          ) : null}

          <button
            type="button"
            onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
            className="mt-5 w-full text-xs text-ink-foreground/60 underline"
          >
            {mode === "signin"
              ? "New here? Create an account"
              : "Already have an account? Sign in"}
          </button>
        </div>
      </div>
    </div>
  );
}
