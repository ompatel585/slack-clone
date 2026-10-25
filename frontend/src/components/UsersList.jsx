import { useCallback, useEffect, useMemo, useState } from "react";
import { useChatContext } from "stream-chat-react";
import toast from "react-hot-toast";

// Distinct 1:1 channels created from a member list get a server-generated "!members-…" id
const isDirectMessage = (channel) => Boolean(channel?.id?.startsWith("!members-"));

const UNREAD_EVENTS = [
  "message.new",
  "notification.message_new",
  "notification.mark_read",
  "message.read",
  "channel.visible",
];

const byPresenceThenName = (a, b) => {
  if (Boolean(a.online) !== Boolean(b.online)) return a.online ? -1 : 1;
  return (a.name || a.id).localeCompare(b.name || b.id);
};

const UsersList = () => {
  const { client, channel: activeChannel, setActiveChannel } = useChatContext();
  const [users, setUsers] = useState([]);
  const [status, setStatus] = useState("loading"); // loading | ready | error
  const [unreadTick, setUnreadTick] = useState(0);
  const [openingId, setOpeningId] = useState(null);

  // Load workspace members once; `presence: true` subscribes this client to their presence
  useEffect(() => {
    let ignore = false;

    client
      .queryUsers({ id: { $ne: client.userID } }, { last_active: -1 }, { limit: 30, presence: true })
      .then(({ users: result }) => {
        if (ignore) return;
        setUsers(result);
        setStatus("ready");
      })
      .catch((error) => {
        if (ignore) return;
        console.error("Error loading users:", error);
        setStatus("error");
      });

    return () => {
      ignore = true;
    };
  }, [client]);

  // Keep online dots live
  useEffect(() => {
    const subscription = client.on("user.presence.changed", (event) => {
      setUsers((current) =>
        current.map((user) => (user.id === event.user?.id ? { ...user, ...event.user } : user))
      );
    });
    return () => subscription.unsubscribe();
  }, [client]);

  // Re-read unread counts whenever messages arrive or get read
  useEffect(() => {
    const bump = () => setUnreadTick((tick) => tick + 1);
    const subscriptions = UNREAD_EVENTS.map((type) => client.on(type, bump));
    return () => subscriptions.forEach((subscription) => subscription.unsubscribe());
  }, [client]);

  const dmChannelsByUser = useMemo(() => {
    const map = new Map();
    for (const channel of Object.values(client.activeChannels)) {
      if (!isDirectMessage(channel)) continue;
      const other = Object.keys(channel.state.members).find((id) => id !== client.userID);
      if (other) map.set(other, channel);
    }
    return map;
    // unreadTick re-runs this when the set of watched channels changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [client, unreadTick, activeChannel]);

  const sortedUsers = useMemo(() => [...users].sort(byPresenceThenName), [users]);

  const openDirectMessage = useCallback(
    async (user) => {
      setOpeningId(user.id);
      try {
        const channel = client.channel("messaging", { members: [client.userID, user.id] });
        await channel.watch();
        setActiveChannel(channel);
      } catch (error) {
        console.error("Error opening direct message:", error);
        toast.error(`Couldn't open a conversation with ${user.name || "this user"}.`);
      } finally {
        setOpeningId(null);
      }
    },
    [client, setActiveChannel]
  );

  if (status === "loading") {
    return (
      <div className="sidebar__skeleton" role="status" aria-label="Loading people">
        {[60, 72, 50].map((width) => (
          <span key={width} className="skeleton-row" style={{ width: `${width}%` }} />
        ))}
      </div>
    );
  }

  if (status === "error") return <p className="sidebar__empty">Couldn't load people.</p>;
  if (sortedUsers.length === 0) return <p className="sidebar__empty">No one else is here yet.</p>;

  return (
    <ul className="dm-list">
      {sortedUsers.map((user) => {
        const channel = dmChannelsByUser.get(user.id);
        const isActive = Boolean(channel && activeChannel?.cid === channel.cid);
        const unread = channel && !isActive ? channel.countUnread() : 0;
        const name = user.name || user.id;

        const classes = ["dm-item", isActive && "is-active", unread > 0 && "has-unread"]
          .filter(Boolean)
          .join(" ");

        return (
          <li key={user.id}>
            <button
              type="button"
              className={classes}
              onClick={() => openDirectMessage(user)}
              disabled={openingId === user.id}
              aria-current={isActive ? "page" : undefined}
              title={name}
            >
              <span className="dm-avatar" aria-hidden="true">
                {user.image ? <img src={user.image} alt="" /> : name[0]}
                <span className={`dm-avatar__status ${user.online ? "is-online" : ""}`} />
              </span>
              <span className="dm-item__name">{name}</span>
              <span className="sr-only">{user.online ? ", online" : ", offline"}</span>
              {unread > 0 && (
                <>
                  <span className="channel-preview__badge" aria-hidden="true">
                    {unread > 99 ? "99+" : unread}
                  </span>
                  <span className="sr-only">, {unread} unread messages</span>
                </>
              )}
            </button>
          </li>
        );
      })}
    </ul>
  );
};

export default UsersList;
