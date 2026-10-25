import { useCallback, useEffect, useState } from "react";
import { Channel, Chat, MessageInput, MessageList, Thread, Window } from "stream-chat-react";
import { useClerk } from "@clerk/clerk-react";
import { LogOut, Menu, MessagesSquare, RefreshCw, WifiOff } from "lucide-react";

import "stream-chat-react/dist/css/v2/index.css";
import "../styles/stream-chat-theme.css";
import "../styles/workspace.css";

import { useStreamChat } from "../hooks/useStreamChat";
import PageLoader from "../components/PageLoader";
import Sidebar from "../components/Sidebar";
import CustomChannelHeader from "../components/CustomChannelHeader";
import EmptyState from "../components/EmptyState";

const describeConnectionError = (error) => {
  if (error?.response?.status === 401) return "Your session has expired. Sign in again to continue.";
  if (error?.code === "ERR_NETWORK" || error?.message === "Network Error") {
    return "We couldn't reach the Slap server. Check your connection and try again.";
  }
  return error?.message || "Something went wrong while connecting to chat.";
};

const ConnectionError = ({ error, onRetry }) => {
  const { signOut } = useClerk();

  return (
    <div className="error-screen" role="alert">
      <EmptyState
        tone="dark"
        icon={<WifiOff size={28} />}
        title="Couldn't connect to your workspace"
        description={describeConnectionError(error)}
        action={
          <div className="error-screen__actions">
            <button type="button" className="btn btn--primary" onClick={onRetry}>
              <RefreshCw size={16} aria-hidden="true" />
              Try again
            </button>
            <button type="button" className="btn btn--ghost" onClick={() => signOut()}>
              <LogOut size={16} aria-hidden="true" />
              Sign out
            </button>
          </div>
        }
      />
    </div>
  );
};

const HomePage = () => {
  const { chatClient, isLoading, error, retry } = useStreamChat();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const openSidebar = useCallback(() => setIsSidebarOpen(true), []);
  const closeSidebar = useCallback(() => setIsSidebarOpen(false), []);

  useEffect(() => {
    if (!isSidebarOpen) return;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") closeSidebar();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isSidebarOpen, closeSidebar]);

  if (error) return <ConnectionError error={error} onRetry={retry} />;
  if (isLoading || !chatClient) return <PageLoader label="Connecting to your workspace…" />;

  const noChannelSelected = (
    <EmptyState
      icon={<MessagesSquare size={28} />}
      title="Pick a conversation"
      description="Choose a channel from the sidebar to start chatting with your team."
      action={
        <button type="button" className="btn btn--primary workspace__browse" onClick={openSidebar}>
          <Menu size={16} aria-hidden="true" />
          Browse channels
        </button>
      }
    />
  );

  return (
    <Chat client={chatClient} theme="str-chat__theme-light">
      <div className="workspace">
        <Sidebar isOpen={isSidebarOpen} onClose={closeSidebar} />
        {isSidebarOpen && <div className="sidebar-backdrop" onClick={closeSidebar} aria-hidden="true" />}

        <main className="workspace__main">
          <Channel EmptyPlaceholder={noChannelSelected}>
            <Window>
              <CustomChannelHeader onMenuClick={openSidebar} />
              <MessageList />
              <MessageInput focus />
            </Window>
            <Thread />
          </Channel>
        </main>
      </div>
    </Chat>
  );
};

export default HomePage;
