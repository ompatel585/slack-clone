import { useEffect, useMemo } from "react";
import { ChannelList, useChatContext } from "stream-chat-react";
import { UserButton, useUser } from "@clerk/clerk-react";
import { Hash, X } from "lucide-react";
import CustomChannelPreview from "./CustomChannelPreview";

const CHANNEL_SORT = { last_message_at: -1 };
const CHANNEL_OPTIONS = { state: true, watch: true, presence: true, limit: 30 };

const ChannelListEmpty = () => (
  <p className="sidebar__empty">No channels yet. Channels you join will show up here.</p>
);

const ChannelListSkeleton = () => (
  <div className="sidebar__skeleton" role="status" aria-label="Loading channels">
    {[70, 55, 80, 45, 62].map((width) => (
      <span key={width} className="skeleton-row" style={{ width: `${width}%` }} />
    ))}
  </div>
);

const Sidebar = ({ isOpen = false, onClose }) => {
  const { client, channel: activeChannel } = useChatContext();
  const { user } = useUser();

  const filters = useMemo(
    () => ({ type: "messaging", members: { $in: [client.userID] } }),
    [client.userID]
  );

  // On mobile the sidebar is a drawer: close it once a conversation is picked
  const activeCid = activeChannel?.cid;
  useEffect(() => {
    if (activeCid) onClose?.();
  }, [activeCid, onClose]);

  return (
    <aside
      id="workspace-sidebar"
      className={`sidebar ${isOpen ? "is-open" : ""}`}
      aria-label="Workspace navigation"
    >
      <header className="sidebar__header">
        <div className="sidebar__brand">
          <img src="/logo.png" alt="" className="sidebar__logo" />
          <span className="sidebar__workspace">Slap</span>
        </div>
        <div className="sidebar__header-actions">
          <UserButton />
          <button
            type="button"
            className="icon-btn sidebar__close"
            onClick={onClose}
            aria-label="Close sidebar"
          >
            <X size={20} />
          </button>
        </div>
      </header>

      <nav className="sidebar__body" aria-label="Channels">
        <div className="sidebar__section-header">
          <Hash size={14} aria-hidden="true" />
          <span>Channels</span>
        </div>

        <ChannelList
          filters={filters}
          sort={CHANNEL_SORT}
          options={CHANNEL_OPTIONS}
          Preview={CustomChannelPreview}
          EmptyStateIndicator={ChannelListEmpty}
          LoadingIndicator={ChannelListSkeleton}
          setActiveChannelOnMount
        />
      </nav>

      <footer className="sidebar__footer">
        {user?.imageUrl && <img src={user.imageUrl} alt="" className="sidebar__avatar" />}
        <div className="sidebar__user">
          <span className="sidebar__user-name">{user?.fullName || user?.username || "You"}</span>
          <span className="sidebar__user-status">
            <span className="presence-dot" aria-hidden="true" />
            Active
          </span>
        </div>
      </footer>
    </aside>
  );
};

export default Sidebar;
