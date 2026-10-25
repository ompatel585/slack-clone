import { Channel, Chat, MessageInput, MessageList, Thread, Window } from "stream-chat-react";
import { MessagesSquare } from "lucide-react";

import "stream-chat-react/dist/css/v2/index.css";
import "../styles/stream-chat-theme.css";
import "../styles/workspace.css";

import { useStreamChat } from "../hooks/useStreamChat";
import PageLoader from "../components/PageLoader";
import Sidebar from "../components/Sidebar";
import CustomChannelHeader from "../components/CustomChannelHeader";
import EmptyState from "../components/EmptyState";

const NoChannelSelected = (
  <EmptyState
    icon={<MessagesSquare size={28} />}
    title="Pick a conversation"
    description="Choose a channel from the sidebar to start chatting with your team."
  />
);

const HomePage = () => {
  const { chatClient, isLoading } = useStreamChat();

  if (isLoading || !chatClient) return <PageLoader label="Connecting to your workspace…" />;

  return (
    <Chat client={chatClient} theme="str-chat__theme-light">
      <div className="workspace">
        <Sidebar />

        <main className="workspace__main">
          <Channel EmptyPlaceholder={NoChannelSelected}>
            <Window>
              <CustomChannelHeader />
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
