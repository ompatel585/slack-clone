import { useEffect, useState } from "react";
import { useChannelStateContext, useChatContext } from "stream-chat-react";
import { Hash, Lock, LogOut, Menu, Pin, UserPlus, Users, Video } from "lucide-react";
import toast from "react-hot-toast";
import Modal from "./Modal";
import MembersModal from "./MembersModal";
import InviteModal from "./InviteModal";
import PinnedMessagesModal from "./PinnedMessagesModal";
import { getErrorMessage, leaveChannel } from "../lib/api";

const relativeTime = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" });

const formatLastSeen = (lastActive) => {
  if (!lastActive) return "Offline";
  const minutes = Math.round((Date.now() - new Date(lastActive).getTime()) / 60000);
  if (minutes < 1) return "Last seen just now";
  if (minutes < 60) return `Last seen ${relativeTime.format(-minutes, "minute")}`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `Last seen ${relativeTime.format(-hours, "hour")}`;
  return `Last seen ${relativeTime.format(-Math.round(hours / 24), "day")}`;
};

// For a 1:1 conversation, the other person — kept live as their presence changes
const useDirectMessagePartner = (channel) => {
  const { client } = useChatContext();
  const isDirectMessage = Boolean(channel.id?.startsWith("!members-"));

  const findPartner = () =>
    Object.values(channel.state.members).find((member) => member.user_id !== client.userID)?.user;

  const [partner, setPartner] = useState(() => (isDirectMessage ? findPartner() : null));

  useEffect(() => {
    if (!isDirectMessage) {
      setPartner(null);
      return;
    }

    const current = Object.values(channel.state.members).find(
      (member) => member.user_id !== client.userID
    )?.user;
    setPartner(current ?? null);

    const subscription = client.on("user.presence.changed", (event) => {
      if (event.user?.id === current?.id) setPartner((previous) => ({ ...previous, ...event.user }));
    });
    return () => subscription.unsubscribe();
  }, [channel, client, isDirectMessage]);

  return partner;
};

const CustomChannelHeader = ({ onMenuClick }) => {
  const { channel, watcher_count: watcherCount = 0, pinnedMessages = [] } = useChannelStateContext();
  const { setActiveChannel } = useChatContext();
  const partner = useDirectMessagePartner(channel);
  const [isStartingCall, setIsStartingCall] = useState(false);
  const [openModal, setOpenModal] = useState(null); // "members" | "invite" | "pinned" | "leave" | null
  const [isLeaving, setIsLeaving] = useState(false);

  const isDirectMessage = Boolean(channel.id?.startsWith("!members-"));
  const name = partner ? partner.name || partner.id : channel.data?.name || channel.id;
  const description = channel.data?.description;
  const ChannelIcon = channel.data?.private ? Lock : Hash;
  const memberCount = channel.data?.member_count ?? Object.keys(channel.state.members).length;
  const closeModal = () => setOpenModal(null);

  // Every call gets a fresh id so an old link in the history never drops people into a new call
  const startCall = async () => {
    setIsStartingCall(true);
    const callUrl = `${window.location.origin}/call/${crypto.randomUUID()}`;
    // Open the tab synchronously so pop-up blockers treat it as user-initiated
    const callWindow = window.open(callUrl, "_blank");
    if (callWindow) callWindow.opener = null;

    try {
      await channel.sendMessage({ text: `📹 I've started a video call — join here: ${callUrl}` });
      if (!callWindow) toast("Pop-up blocked — use the link in the chat to join.", { icon: "📹" });
    } catch (error) {
      console.error("Error sharing call link:", error);
      toast.error("Couldn't post the call link to this conversation.");
    } finally {
      setIsStartingCall(false);
    }
  };

  const handleLeave = async () => {
    setIsLeaving(true);
    try {
      await leaveChannel(channel.id);
      toast.success(`You left #${name}`);
      closeModal();
      setActiveChannel(undefined);
    } catch (error) {
      toast.error(getErrorMessage(error, "Couldn't leave the channel."));
      setIsLeaving(false);
    }
  };

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

      {partner ? (
        <div className="channel-header__info channel-header__info--dm">
          <span className="dm-avatar dm-avatar--lg" aria-hidden="true">
            {partner.image ? <img src={partner.image} alt="" /> : name[0]}
            <span className={`dm-avatar__status ${partner.online ? "is-online" : ""}`} />
          </span>
          <div className="channel-header__dm-text">
            <h2 className="channel-header__title">
              <span className="channel-header__name">{name}</span>
            </h2>
            <p className={`channel-header__presence ${partner.online ? "is-online" : ""}`}>
              {partner.online ? "Active now" : formatLastSeen(partner.last_active)}
            </p>
          </div>
        </div>
      ) : (
        <div className="channel-header__info">
          <h2 className="channel-header__title">
            <ChannelIcon size={18} aria-hidden="true" />
            <span className="channel-header__name">{name}</span>
          </h2>
          {description && <p className="channel-header__description">{description}</p>}
        </div>
      )}

      <div className="channel-header__meta">
        {!isDirectMessage && (
          <button
            type="button"
            className="channel-header__stat channel-header__stat--button"
            onClick={() => setOpenModal("members")}
            title="View members"
          >
            <Users size={16} aria-hidden="true" />
            {memberCount}
            <span className="sr-only">members — view list</span>
          </button>
        )}
        {!isDirectMessage && watcherCount > 0 && (
          <span className="channel-header__stat channel-header__stat--online">
            <span className="presence-dot" aria-hidden="true" />
            {watcherCount}
            <span className="channel-header__stat-label"> online</span>
          </span>
        )}

        <div className="channel-header__actions">
          <button
            type="button"
            className="icon-btn"
            onClick={startCall}
            disabled={isStartingCall}
            aria-label="Start a video call"
            title="Start a video call"
          >
            <Video size={18} />
          </button>
          <button
            type="button"
            className="icon-btn icon-btn--counter"
            onClick={() => setOpenModal("pinned")}
            aria-label={`Pinned messages (${pinnedMessages.length})`}
            title="Pinned messages"
          >
            <Pin size={18} />
            {pinnedMessages.length > 0 && (
              <span className="icon-btn__count" aria-hidden="true">
                {pinnedMessages.length}
              </span>
            )}
          </button>
          {!isDirectMessage && (
            <>
              <button
                type="button"
                className="icon-btn"
                onClick={() => setOpenModal("invite")}
                aria-label="Invite people"
                title="Invite people"
              >
                <UserPlus size={18} />
              </button>
              <button
                type="button"
                className="icon-btn icon-btn--danger"
                onClick={() => setOpenModal("leave")}
                aria-label="Leave channel"
                title="Leave channel"
              >
                <LogOut size={18} />
              </button>
            </>
          )}
        </div>
      </div>

      {openModal === "members" && (
        <MembersModal channel={channel} onClose={closeModal} onInvite={() => setOpenModal("invite")} />
      )}
      {openModal === "invite" && <InviteModal channel={channel} onClose={closeModal} />}
      {openModal === "pinned" && <PinnedMessagesModal onClose={closeModal} />}
      {openModal === "leave" && (
        <Modal
          title={`Leave #${name}?`}
          onClose={closeModal}
          size="sm"
          footer={
            <>
              <button type="button" className="btn btn--ghost" onClick={closeModal} data-autofocus>
                Cancel
              </button>
              <button type="button" className="btn btn--danger" onClick={handleLeave} disabled={isLeaving}>
                {isLeaving && <span className="spinner spinner--sm" aria-hidden="true" />}
                Leave channel
              </button>
            </>
          }
        >
          <p className="confirm-text">
            {channel.data?.private
              ? "This channel is private — you'll need an invite from a member to rejoin."
              : "You can rejoin any time from Browse channels."}
          </p>
        </Modal>
      )}
    </header>
  );
};

export default CustomChannelHeader;
