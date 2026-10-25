import { useEffect, useMemo, useState } from "react";
import { useChatContext } from "stream-chat-react";
import { Hash, Search, Users } from "lucide-react";
import toast from "react-hot-toast";
import Modal from "./Modal";
import { getErrorMessage, getPublicChannels, joinChannel } from "../lib/api";

const BrowseChannelsModal = ({ onClose, onCreateChannel }) => {
  const { client, setActiveChannel } = useChatContext();

  const [channels, setChannels] = useState([]);
  const [status, setStatus] = useState("loading"); // loading | ready | error
  const [query, setQuery] = useState("");
  const [pendingId, setPendingId] = useState(null);

  useEffect(() => {
    let ignore = false;

    getPublicChannels()
      .then((result) => {
        if (ignore) return;
        setChannels(result);
        setStatus("ready");
      })
      .catch((error) => {
        if (ignore) return;
        console.error("Error loading public channels:", error);
        setStatus("error");
      });

    return () => {
      ignore = true;
    };
  }, []);

  const visibleChannels = useMemo(() => {
    const search = query.trim().toLowerCase();
    if (!search) return channels;
    return channels.filter(
      (channel) =>
        channel.name.toLowerCase().includes(search) ||
        channel.description.toLowerCase().includes(search)
    );
  }, [channels, query]);

  const openChannel = async (channelSummary) => {
    setPendingId(channelSummary.id);
    try {
      if (!channelSummary.isMember) {
        await joinChannel(channelSummary.id);
        toast.success(`Joined #${channelSummary.name}`);
      }

      const channel = client.channel("messaging", channelSummary.id);
      await channel.watch();
      setActiveChannel(channel);
      onClose();
    } catch (error) {
      toast.error(getErrorMessage(error, "Couldn't open the channel."));
      setPendingId(null);
    }
  };

  return (
    <Modal
      title="Browse channels"
      description="Find public channels across the workspace and jump in."
      onClose={onClose}
      size="lg"
    >
      <div className="input-group">
        <Search size={16} className="input-group__icon" aria-hidden="true" />
        <input
          className="input"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search by name or description"
          aria-label="Search channels"
          data-autofocus
        />
      </div>

      {status === "loading" && (
        <div className="modal__status" role="status">
          <span className="spinner spinner--sm modal__spinner" aria-hidden="true" />
          Loading channels…
        </div>
      )}

      {status === "error" && (
        <p className="modal__status modal__status--error" role="alert">
          Couldn't load channels. Close this window and try again.
        </p>
      )}

      {status === "ready" && visibleChannels.length === 0 && (
        <div className="modal__status">
          <p>{query ? `No channels match “${query}”.` : "There are no public channels yet."}</p>
          {onCreateChannel && (
            <button type="button" className="btn btn--primary" onClick={onCreateChannel}>
              Create a channel
            </button>
          )}
        </div>
      )}

      {status === "ready" && visibleChannels.length > 0 && (
        <ul className="browse-list">
          {visibleChannels.map((channel) => (
            <li key={channel.cid} className="browse-item">
              <span className="browse-item__icon" aria-hidden="true">
                <Hash size={18} />
              </span>
              <div className="browse-item__info">
                <span className="browse-item__name">
                  {channel.name}
                  {channel.isMember && <span className="badge">Joined</span>}
                </span>
                {channel.description && (
                  <span className="browse-item__description">{channel.description}</span>
                )}
                <span className="browse-item__meta">
                  <Users size={13} aria-hidden="true" />
                  {channel.memberCount} {channel.memberCount === 1 ? "member" : "members"}
                </span>
              </div>
              <button
                type="button"
                className={`btn ${channel.isMember ? "btn--ghost" : "btn--primary"}`}
                onClick={() => openChannel(channel)}
                disabled={pendingId !== null}
                aria-label={`${channel.isMember ? "Open" : "Join"} #${channel.name}`}
              >
                {pendingId === channel.id ? (
                  <span className="spinner spinner--sm" aria-hidden="true" />
                ) : channel.isMember ? (
                  "Open"
                ) : (
                  "Join"
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </Modal>
  );
};

export default BrowseChannelsModal;
