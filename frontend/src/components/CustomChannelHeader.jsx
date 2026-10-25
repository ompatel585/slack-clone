import { useChannelStateContext } from "stream-chat-react";
import { Hash, Lock, Menu, Users } from "lucide-react";

const CustomChannelHeader = ({ onMenuClick }) => {
  const { channel, watcher_count: watcherCount = 0 } = useChannelStateContext();

  const name = channel.data?.name || channel.id;
  const description = channel.data?.description;
  const ChannelIcon = channel.data?.private ? Lock : Hash;
  const memberCount = channel.data?.member_count ?? Object.keys(channel.state.members).length;

  return (
    <header className="channel-header">
      {onMenuClick && (
        <button
          type="button"
          className="icon-btn channel-header__menu"
          onClick={onMenuClick}
          aria-label="Open sidebar"
          aria-controls="workspace-sidebar"
        >
          <Menu size={20} />
        </button>
      )}

      <div className="channel-header__info">
        <h2 className="channel-header__title">
          <ChannelIcon size={18} aria-hidden="true" />
          <span className="channel-header__name">{name}</span>
        </h2>
        {description && <p className="channel-header__description">{description}</p>}
      </div>

      <div className="channel-header__meta">
        <span className="channel-header__stat" title={`${memberCount} members`}>
          <Users size={16} aria-hidden="true" />
          {memberCount}
          <span className="sr-only">members</span>
        </span>
        {watcherCount > 0 && (
          <span className="channel-header__stat channel-header__stat--online">
            <span className="presence-dot" aria-hidden="true" />
            {watcherCount}
            <span className="channel-header__stat-label"> online</span>
          </span>
        )}
        {/* Channel actions (call, members, invite, pins) are added in Task 3 */}
        <div className="channel-header__actions" />
      </div>
    </header>
  );
};

export default CustomChannelHeader;
