import { useChannelActionContext, useChannelStateContext } from "stream-chat-react";
import { Pin } from "lucide-react";
import Modal from "./Modal";

const formatDate = (value) =>
  new Date(value).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

const PinnedMessagesModal = ({ onClose }) => {
  // pinnedMessages comes from channel state and updates when messages are pinned or unpinned
  const { pinnedMessages = [] } = useChannelStateContext();
  const { jumpToMessage } = useChannelActionContext();

  const sorted = [...pinnedMessages].sort(
    (a, b) => new Date(b.pinned_at ?? b.created_at) - new Date(a.pinned_at ?? a.created_at)
  );

  const openMessage = (messageId) => {
    onClose();
    jumpToMessage(messageId);
  };

  return (
    <Modal
      title="Pinned messages"
      description="Pin important messages from a message's action menu to keep them here."
      onClose={onClose}
    >
      {sorted.length === 0 ? (
        <div className="modal__status">
          <Pin size={28} aria-hidden="true" />
          <p>Nothing pinned yet.</p>
        </div>
      ) : (
        <ul className="pinned-list">
          {sorted.map((message) => {
            const author = message.user?.name || message.user?.id || "Unknown";
            return (
              <li key={message.id}>
                <button type="button" className="pinned-item" onClick={() => openMessage(message.id)}>
                  <span className="pinned-item__meta">
                    <strong>{author}</strong>
                    <span>{formatDate(message.created_at)}</span>
                  </span>
                  <span className="pinned-item__text">
                    {message.text || (message.attachments?.length ? "📎 Attachment" : "Message")}
                  </span>
                  {message.pinned_by && (
                    <span className="pinned-item__by">
                      <Pin size={12} aria-hidden="true" /> Pinned by{" "}
                      {message.pinned_by.name || message.pinned_by.id}
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </Modal>
  );
};

export default PinnedMessagesModal;
