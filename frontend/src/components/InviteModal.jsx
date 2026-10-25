import { useEffect, useMemo, useState } from "react";
import { useChatContext } from "stream-chat-react";
import { Check, Search } from "lucide-react";
import toast from "react-hot-toast";
import Modal from "./Modal";
import { addChannelMembers, getErrorMessage } from "../lib/api";

const InviteModal = ({ channel, onClose }) => {
  const { client } = useChatContext();
  const [candidates, setCandidates] = useState([]);
  const [status, setStatus] = useState("loading"); // loading | ready | error
  const [query, setQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState(() => new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Everyone in the workspace who isn't already in the channel
  useEffect(() => {
    let ignore = false;

    const load = async () => {
      try {
        const [{ members }, { users }] = await Promise.all([
          channel.queryMembers({}, {}, { limit: 100 }),
          client.queryUsers({ id: { $ne: client.userID } }, { name: 1 }, { limit: 100 }),
        ]);
        if (ignore) return;

        const memberIds = new Set(members.map((member) => member.user_id));
        setCandidates(users.filter((user) => !memberIds.has(user.id)));
        setStatus("ready");
      } catch (error) {
        if (ignore) return;
        console.error("Error loading people to invite:", error);
        setStatus("error");
      }
    };

    load();
    return () => {
      ignore = true;
    };
  }, [channel, client]);

  const visibleCandidates = useMemo(() => {
    const search = query.trim().toLowerCase();
    if (!search) return candidates;
    return candidates.filter((user) => (user.name || user.id).toLowerCase().includes(search));
  }, [candidates, query]);

  const toggle = (userId) => {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  };

  const handleInvite = async () => {
    if (selectedIds.size === 0) return;

    setIsSubmitting(true);
    try {
      const added = (await addChannelMembers(channel.id, [...selectedIds])) ?? [];
      const count = added.length || selectedIds.size;
      toast.success(
        count === 1
          ? `${added[0]?.name || "1 person"} added to #${channel.data?.name}`
          : `${count} people added to #${channel.data?.name}`
      );
      onClose();
    } catch (error) {
      toast.error(getErrorMessage(error, "Couldn't invite those people."));
      setIsSubmitting(false);
    }
  };

  const footer = (
    <>
      <button type="button" className="btn btn--ghost" onClick={onClose}>
        Cancel
      </button>
      <button
        type="button"
        className="btn btn--primary"
        onClick={handleInvite}
        disabled={selectedIds.size === 0 || isSubmitting}
      >
        {isSubmitting && <span className="spinner spinner--sm" aria-hidden="true" />}
        {selectedIds.size > 1 ? `Invite ${selectedIds.size} people` : "Invite"}
      </button>
    </>
  );

  return (
    <Modal
      title={`Invite people to #${channel.data?.name || channel.id}`}
      description="They'll see the full history and get notified."
      onClose={onClose}
      footer={footer}
    >
      <div className="input-group">
        <Search size={16} className="input-group__icon" aria-hidden="true" />
        <input
          className="input"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search people"
          aria-label="Search people"
          data-autofocus
        />
      </div>

      {status === "loading" && (
        <div className="modal__status" role="status">
          <span className="spinner spinner--sm modal__spinner" aria-hidden="true" />
          Loading people…
        </div>
      )}

      {status === "error" && (
        <p className="modal__status modal__status--error" role="alert">
          Couldn't load people.
        </p>
      )}

      {status === "ready" && (
        <ul className="picker-list picker-list--tall">
          {visibleCandidates.length === 0 && (
            <li className="picker-list__empty">
              {candidates.length === 0 ? "Everyone is already in this channel." : "No people found"}
            </li>
          )}
          {visibleCandidates.map((user) => {
            const isSelected = selectedIds.has(user.id);
            const name = user.name || user.id;
            return (
              <li key={user.id}>
                <label className={`picker-item ${isSelected ? "is-selected" : ""}`}>
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={isSelected}
                    onChange={() => toggle(user.id)}
                  />
                  <span className="avatar avatar--sm" aria-hidden="true">
                    {user.image ? <img src={user.image} alt="" /> : name[0]}
                  </span>
                  <span className="picker-item__name">{name}</span>
                  <span className="picker-item__check" aria-hidden="true">
                    {isSelected && <Check size={14} />}
                  </span>
                </label>
              </li>
            );
          })}
        </ul>
      )}
    </Modal>
  );
};

export default InviteModal;
