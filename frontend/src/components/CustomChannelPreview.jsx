import { Hash, Lock } from "lucide-react";

const formatUnread = (count) => (count > 99 ? "99+" : count);

const CustomChannelPreview = ({ channel, active, setActiveChannel, unread = 0, displayTitle }) => {
  const name = channel.data?.name || displayTitle || channel.id;
  const ChannelIcon = channel.data?.private ? Lock : Hash;
  const hasUnread = unread > 0 && !active;

  const classes = ["channel-preview", active && "is-active", hasUnread && "has-unread"]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      type="button"
      className={classes}
      onClick={() => setActiveChannel?.(channel)}
      aria-current={active ? "page" : undefined}
      title={name}
    >
      <ChannelIcon className="channel-preview__icon" size={16} aria-hidden="true" />
      <span className="channel-preview__name">{name}</span>
      {hasUnread && (
        <>
          <span className="channel-preview__badge" aria-hidden="true">
            {formatUnread(unread)}
          </span>
          <span className="sr-only">, {unread} unread messages</span>
        </>
      )}
    </button>
  );
};

export default CustomChannelPreview;
