import { useQuery } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { ChatAssistant } from "./ChatAssistant";
import { Footer } from "./Footer";
import { Header } from "./Header";
import { fetchSettings } from "@/lib/store";

export const settingsQuery = {
  queryKey: ["site-settings"],
  queryFn: fetchSettings,
};

export function SiteLayout({ children }: { children: ReactNode }) {
  const { data: settings } = useQuery(settingsQuery);
  const map = settings ?? {};

  return (
    <div className="flex min-h-screen flex-col">
      <Header announcement={map["announcement"]} />
      <main className="flex-1">{children}</main>
      <Footer settings={map} />
      <ChatAssistant />
    </div>
  );
}

