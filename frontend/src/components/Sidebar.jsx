import { useEffect, useMemo, useState } from "react";
import { ChannelList, useChatContext } from "stream-chat-react";
import { UserButton, useUser } from "@clerk/clerk-react";
import { Compass, Hash, MessageCircle, Plus, Search, X } from "lucide-react";
import CustomChannelPreview from "./CustomChannelPreview";
import CreateChannelModal from "./CreateChannelModal";
import BrowseChannelsModal from "./BrowseChannelsModal";
import UsersList from "./UsersList";

const CHANNEL_SORT = { last_message_at: -1 };
const CHANNEL_OPTIONS = { state: true, watch: true, presence: true, limit: 30 };

// 1:1 conversations live in the "Direct messages" section, not among channels
const withoutDirectMessages = (channels) =>
  channels.filter((channel) => !channel.id?.startsWith("!members-"));

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

const IS_MAC = typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.userAgent);

const Sidebar = ({ isOpen = false, onClose, onOpenSearch }) => {
  const { client, channel: activeChannel } = useChatContext();
  const { user } = useUser();
  const [openModal, setOpenModal] = useState(null); // "create" | "browse" | null

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

      {onOpenSearch && (
        <div className="sidebar__search-wrap">
          <button type="button" className="sidebar__search" onClick={onOpenSearch}>
            <Search size={15} aria-hidden="true" />
            <span>Search messages</span>
            <kbd className="sidebar__kbd" aria-label={IS_MAC ? "Command K" : "Control K"}>
              {IS_MAC ? "⌘K" : "Ctrl K"}
            </kbd>
          </button>
        </div>
      )}

      <nav className="sidebar__body" aria-label="Channels">
        <div className="sidebar__section-header">
          <Hash size={14} aria-hidden="true" />
          <span>Channels</span>
          <div className="sidebar__section-actions">
            <button
              type="button"
              className="sidebar__section-btn"
              onClick={() => setOpenModal("browse")}
              aria-label="Browse channels"
              title="Browse channels"
            >
              <Compass size={15} />
            </button>
            <button
              type="button"
              className="sidebar__section-btn"
              onClick={() => setOpenModal("create")}
              aria-label="Create channel"
              title="Create channel"
            >
              <Plus size={16} />
            </button>
          </div>
        </div>

        <ChannelList
          filters={filters}
          sort={CHANNEL_SORT}
          options={CHANNEL_OPTIONS}
          Preview={CustomChannelPreview}
          EmptyStateIndicator={ChannelListEmpty}
          LoadingIndicator={ChannelListSkeleton}
          channelRenderFilterFn={withoutDirectMessages}
          setActiveChannelOnMount
        />

        <div className="sidebar__section-header sidebar__section-header--spaced">
          <MessageCircle size={14} aria-hidden="true" />
          <span>Direct messages</span>
        </div>
        <UsersList />
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

      {openModal === "create" && <CreateChannelModal onClose={() => setOpenModal(null)} />}
      {openModal === "browse" && (
        <BrowseChannelsModal
          onClose={() => setOpenModal(null)}
          onCreateChannel={() => setOpenModal("create")}
        />
      )}
    </aside>
  );
};

export default Sidebar;
