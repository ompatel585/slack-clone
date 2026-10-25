import { useEffect, useMemo, useState } from "react";
import { useChatContext } from "stream-chat-react";
import { Check, Globe, Hash, Lock, Search } from "lucide-react";
import toast from "react-hot-toast";
import Modal from "./Modal";
import { createChannel, getErrorMessage } from "../lib/api";

const MAX_DESCRIPTION = 200;

// Mirrors the server's normalisation so the user sees the final name while typing
const toChannelName = (value) =>
  value
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9_-]/g, "")
    .replace(/-{2,}/g, "-")
    .slice(0, 40);

const CreateChannelModal = ({ onClose }) => {
  const { client, setActiveChannel } = useChatContext();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [users, setUsers] = useState([]);
  const [selectedIds, setSelectedIds] = useState(() => new Set());
  const [memberQuery, setMemberQuery] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const channelName = toChannelName(name);
  const canSubmit = channelName.length >= 2 && !isSubmitting;

  useEffect(() => {
    let ignore = false;

    client
      .queryUsers({ id: { $ne: client.userID } }, { name: 1 }, { limit: 50 })
      .then(({ users: result }) => {
        if (!ignore) setUsers(result);
      })
      .catch((error) => console.error("Error loading users:", error));

    return () => {
      ignore = true;
    };
  }, [client]);

  const visibleUsers = useMemo(() => {
    const query = memberQuery.trim().toLowerCase();
    if (!query) return users;
    return users.filter((user) => (user.name || user.id).toLowerCase().includes(query));
  }, [users, memberQuery]);

  const toggleMember = (userId) => {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!canSubmit) return;

    setIsSubmitting(true);
    try {
      const created = await createChannel({
        name: channelName,
        description: description.trim(),
        isPrivate,
        memberIds: [...selectedIds],
      });

      const channel = client.channel("messaging", created.id);
      await channel.watch();
      setActiveChannel(channel);

      toast.success(`#${created.name} is ready`);
      onClose();
    } catch (error) {
      toast.error(getErrorMessage(error, "Couldn't create the channel."));
      setIsSubmitting(false);
    }
  };

  const footer = (
    <>
      <button type="button" className="btn btn--ghost" onClick={onClose}>
        Cancel
      </button>
      <button type="submit" form="create-channel-form" className="btn btn--primary" disabled={!canSubmit}>
        {isSubmitting ? <span className="spinner spinner--sm" aria-hidden="true" /> : null}
        {isSubmitting ? "Creating…" : "Create channel"}
      </button>
    </>
  );

  return (
    <Modal
      title="Create a channel"
      description="Channels are where your team talks about a topic, project or team."
      onClose={onClose}
      footer={footer}
    >
      <form id="create-channel-form" className="form" onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="channel-name" className="field__label">
            Name
          </label>
          <div className="input-group">
            <Hash size={16} className="input-group__icon" aria-hidden="true" />
            <input
              id="channel-name"
              className="input"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="e.g. product-launch"
              maxLength={60}
              data-autofocus
              autoComplete="off"
              required
            />
          </div>
          <p className="field__hint">
            {channelName && channelName !== name ? (
              <>
                Will be created as <strong>#{channelName}</strong>
              </>
            ) : (
              "Lowercase letters, numbers, dashes and underscores."
            )}
          </p>
        </div>

        <div className="field">
          <label htmlFor="channel-description" className="field__label">
            Description <span className="field__optional">(optional)</span>
          </label>
          <textarea
            id="channel-description"
            className="input textarea"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="What's this channel about?"
            maxLength={MAX_DESCRIPTION}
            rows={2}
          />
          <p className="field__hint field__hint--end">
            {description.length}/{MAX_DESCRIPTION}
          </p>
        </div>

        <fieldset className="field">
          <legend className="field__label">Visibility</legend>
          <div className="choice-cards">
            <label className={`choice-card ${!isPrivate ? "is-selected" : ""}`}>
              <input
                type="radio"
                name="visibility"
                className="sr-only"
                checked={!isPrivate}
                onChange={() => setIsPrivate(false)}
              />
              <Globe size={18} aria-hidden="true" />
              <span>
                <strong>Public</strong>
                <small>Anyone in the workspace can find and join</small>
              </span>
            </label>
            <label className={`choice-card ${isPrivate ? "is-selected" : ""}`}>
              <input
                type="radio"
                name="visibility"
                className="sr-only"
                checked={isPrivate}
                onChange={() => setIsPrivate(true)}
              />
              <Lock size={18} aria-hidden="true" />
              <span>
                <strong>Private</strong>
                <small>Only invited people can see it</small>
              </span>
            </label>
          </div>
        </fieldset>

        <fieldset className="field">
          <legend className="field__label">
            Add people <span className="field__optional">({selectedIds.size} selected)</span>
          </legend>
          <div className="input-group">
            <Search size={16} className="input-group__icon" aria-hidden="true" />
            <input
              className="input"
              value={memberQuery}
              onChange={(event) => setMemberQuery(event.target.value)}
              placeholder="Search people"
              aria-label="Search people"
            />
          </div>
          <ul className="picker-list">
            {visibleUsers.length === 0 && <li className="picker-list__empty">No people found</li>}
            {visibleUsers.map((user) => {
              const isSelected = selectedIds.has(user.id);
              return (
                <li key={user.id}>
                  <label className={`picker-item ${isSelected ? "is-selected" : ""}`}>
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={isSelected}
                      onChange={() => toggleMember(user.id)}
                    />
                    <span className="avatar avatar--sm" aria-hidden="true">
                      {user.image ? <img src={user.image} alt="" /> : (user.name || user.id)[0]}
                    </span>
                    <span className="picker-item__name">{user.name || user.id}</span>
                    <span className="picker-item__check" aria-hidden="true">
                      {isSelected && <Check size={14} />}
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>
        </fieldset>
      </form>
    </Modal>
  );
};

export default CreateChannelModal;
