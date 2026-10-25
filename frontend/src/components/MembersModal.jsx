import { useEffect, useMemo, useState } from "react";
import { useChatContext } from "stream-chat-react";
import { Search, UserPlus } from "lucide-react";
import Modal from "./Modal";

const roleLabel = (member, ownerId) => {
  if (member.user_id === ownerId) return "Owner";
  if (member.channel_role === "channel_moderator") return "Moderator";
  return null;
};

const MembersModal = ({ channel, onClose, onInvite }) => {
  const { client } = useChatContext();
  const [members, setMembers] = useState([]);
  const [status, setStatus] = useState("loading"); // loading | ready | error
  const [query, setQuery] = useState("");

  useEffect(() => {
    let ignore = false;

    channel
      .queryMembers({}, { created_at: 1 }, { limit: 100 })
      .then(({ members: result }) => {
        if (ignore) return;
        setMembers(result);
        setStatus("ready");
      })
      .catch((error) => {
        if (ignore) return;
        console.error("Error loading members:", error);
        setStatus("error");
      });

    return () => {
      ignore = true;
    };
  }, [channel]);

  const ownerId = channel.data?.created_by?.id;

  const visibleMembers = useMemo(() => {
    const search = query.trim().toLowerCase();
    return members
      .filter((member) => (member.user?.name || member.user_id).toLowerCase().includes(search))
      .sort((a, b) => Boolean(b.user?.online) - Boolean(a.user?.online));
  }, [members, query]);

  const footer = onInvite ? (
    <button type="button" className="btn btn--primary" onClick={onInvite}>
      <UserPlus size={16} aria-hidden="true" />
      Invite people
    </button>
  ) : null;

  return (
    <Modal
      title={`Members of #${channel.data?.name || channel.id}`}
      description={status === "ready" ? `${members.length} ${members.length === 1 ? "person" : "people"}` : undefined}
      onClose={onClose}
      footer={footer}
    >
      <div className="input-group">
        <Search size={16} className="input-group__icon" aria-hidden="true" />
        <input
          className="input"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Find a member"
          aria-label="Find a member"
          data-autofocus
        />
      </div>

      {status === "loading" && (
        <div className="modal__status" role="status">
          <span className="spinner spinner--sm modal__spinner" aria-hidden="true" />
          Loading members…
        </div>
      )}

      {status === "error" && (
        <p className="modal__status modal__status--error" role="alert">
          Couldn't load members.
        </p>
      )}

      {status === "ready" && (
        <ul className="member-list">
          {visibleMembers.length === 0 && <li className="picker-list__empty">No members match.</li>}
          {visibleMembers.map((member) => {
            const name = member.user?.name || member.user_id;
            const role = roleLabel(member, ownerId);
            return (
              <li key={member.user_id} className="member-item">
                <span className="avatar avatar--sm" aria-hidden="true">
                  {member.user?.image ? <img src={member.user.image} alt="" /> : name[0]}
                </span>
                <span className="member-item__name">
                  {name}
                  {member.user_id === client.userID && <span className="member-item__you"> (you)</span>}
                </span>
                {role && <span className="badge">{role}</span>}
                <span className={`member-item__status ${member.user?.online ? "is-online" : ""}`}>
                  {member.user?.online ? "Online" : "Offline"}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </Modal>
  );
};

export default MembersModal;
