import { useState } from "react";
import { AuthPage } from "./pages/Auth";
import { PoolPage } from "./pages/Pool";
import { PipelinePage } from "./pages/Pipeline";
import { SessionPage } from "./pages/Session";

type Page = "pool" | "pipeline" | "session";

export default function App() {
  const [token, setToken] = useState<string | null>(localStorage.getItem("token"));
  const [activePage, setActivePage] = useState<Page>("pool");
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

  if (!token) {
    return <AuthPage onLogin={() => setToken(localStorage.getItem("token"))} />;
  }

  const renderPage = () => {
    if (activePage === "session" && activeSessionId) {
      return <SessionPage sessionId={activeSessionId} />;
    }
    if (activePage === "pipeline") return <PipelinePage />;
    return <PoolPage />;
  };

  // setActiveSessionId is exposed for future session navigation
  const navigateToSession = (sessionId: string) => {
    setActiveSessionId(sessionId);
    setActivePage("session");
  };

  return (
    <div className="relative" data-navigate-session="ready" ref={el => { if (el) (el as HTMLDivElement & { navigateToSession?: typeof navigateToSession }).navigateToSession = navigateToSession; }}>
      {renderPage()}
      {/* Bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-[#0D0D1A] border-t border-[#2A2A4A] flex">
        {(["pool", "pipeline"] as Page[]).map(page => (
          <button
            key={page}
            onClick={() => setActivePage(page)}
            className={`flex-1 py-3 font-mono text-xs ${
              activePage === page ? "text-[#C4956A]" : "text-[#A09CA0]"
            }`}
          >
            {page === "pool" ? "候选人池" : "管道"}
          </button>
        ))}
      </nav>
    </div>
  );
}
