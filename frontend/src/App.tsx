import { useState, useEffect } from "react";
import { AuthPage } from "./pages/Auth";
import { OnboardingPage } from "./pages/Onboarding";
import { PoolPage } from "./pages/Pool";
import { PipelinePage } from "./pages/Pipeline";
import { InboxPage } from "./pages/Inbox";
import { SessionPage } from "./pages/Session";
import { DemoPage } from "./pages/Demo";
import { api } from "./services/api";

type Page = "pool" | "pipeline" | "inbox" | "session";

const NAV: { key: Page; label: string }[] = [
  { key: "pool", label: "发现" },
  { key: "inbox", label: "收到" },
  { key: "pipeline", label: "管道" },
];

export default function App() {
  // Demo mode: /#demo shows all components with mock data
  if (window.location.hash === "#demo") {
    return <DemoPage />;
  }

  const [token, setToken] = useState<string | null>(localStorage.getItem("token"));
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [activePage, setActivePage] = useState<Page>("pool");
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [inboxCount, setInboxCount] = useState(0);

  // Check profile completeness for returning users
  useEffect(() => {
    if (!token || showOnboarding) return;
    api.getProfile().then((profile) => {
      const p = profile as { is_complete?: boolean };
      if (p.is_complete === false) setShowOnboarding(true);
    }).catch(() => {});
  }, [token, showOnboarding]);

  // Poll inbox count for badge
  useEffect(() => {
    if (!token) return;
    const refresh = () =>
      api.getReceivedApproaches().then(list => setInboxCount(list.length)).catch(() => {});
    refresh();
    const timer = setInterval(refresh, 30_000);
    return () => clearInterval(timer);
  }, [token]);

  if (!token) {
    return (
      <AuthPage
        onLogin={(isNew: boolean) => {
          setToken(localStorage.getItem("token"));
          setShowOnboarding(isNew);
        }}
      />
    );
  }

  if (showOnboarding) {
    return <OnboardingPage onComplete={() => setShowOnboarding(false)} />;
  }

  const renderPage = () => {
    if (activePage === "session" && activeSessionId) {
      return (
        <SessionPage
          sessionId={activeSessionId}
          onExit={() => { setActiveSessionId(null); setActivePage("pipeline"); }}
        />
      );
    }
    if (activePage === "pipeline") return <PipelinePage />;
    if (activePage === "inbox") return <InboxPage />;
    return <PoolPage />;
  };

  const navigateToSession = (sessionId: string) => {
    setActiveSessionId(sessionId);
    setActivePage("session");
  };

  return (
    <div
      className="relative"
      data-navigate-session="ready"
      ref={el => {
        if (el) (el as HTMLDivElement & { navigateToSession?: typeof navigateToSession }).navigateToSession = navigateToSession;
      }}
    >
      {renderPage()}
      {activePage !== "session" && (
      <nav className="fixed bottom-0 left-0 right-0 bg-[#0D0D1A] border-t border-[#2A2A4A] flex">
        {NAV.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setActivePage(key)}
            className={`flex-1 py-3 font-mono text-xs relative ${
              activePage === key ? "text-[#C4956A]" : "text-[#A09CA0]"
            }`}
          >
            {label}
            {key === "inbox" && inboxCount > 0 && (
              <span className="absolute top-2 right-1/4 bg-red-500 text-white text-[9px] font-mono w-4 h-4 flex items-center justify-center rounded-full">
                {inboxCount > 9 ? "9+" : inboxCount}
              </span>
            )}
          </button>
        ))}
      </nav>
      )}
    </div>
  );
}
