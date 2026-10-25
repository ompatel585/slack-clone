import { useEffect, useId, useState } from "react";
import { useChatContext } from "stream-chat-react";
import { Hash, MessageCircle, Search } from "lucide-react";
import Modal from "./Modal";

const MIN_QUERY_LENGTH = 2;
const DEBOUNCE_MS = 300;

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const Highlight = ({ text, query }) => {
  if (!query) return text;
  const parts = text.split(new RegExp(`(${escapeRegExp(query)})`, "gi"));
  return parts.map((part, index) =>
    part.toLowerCase() === query.toLowerCase() ? <mark key={index}>{part}</mark> : part
  );
};

const formatWhen = (value) =>
  new Date(value).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });

const SearchModal = ({ onClose, onSelect }) => {
  const { client } = useChatContext();
  const listId = useId();

  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [status, setStatus] = useState("idle"); // idle | loading | ready | error
  const [activeIndex, setActiveIndex] = useState(0);

  const trimmed = query.trim();

  // Debounced search across every channel the user belongs to
  useEffect(() => {
    if (trimmed.length < MIN_QUERY_LENGTH) {
      setResults([]);
      setStatus("idle");
      return;
    }

    let ignore = false;
    setStatus("loading");

    const timer = setTimeout(async () => {
      try {
        const response = await client.search(
          { members: { $in: [client.userID] } },
          trimmed,
          { limit: 20, sort: [{ created_at: -1 }] }
        );
        if (ignore) return;
        setResults(response.results.map(({ message }) => message));
        setActiveIndex(0);
        setStatus("ready");
      } catch (error) {
        if (ignore) return;
        console.error("Error searching messages:", error);
        setStatus("error");
      }
    }, DEBOUNCE_MS);

    return () => {
      ignore = true;
      clearTimeout(timer);
    };
  }, [client, trimmed]);

  const choose = (message) => {
    if (!message) return;
    onSelect(message);
    onClose();
  };

  const handleKeyDown = (event) => {
    if (results.length === 0) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((index) => (index + 1) % results.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) => (index - 1 + results.length) % results.length);
    } else if (event.key === "Enter") {
      event.preventDefault();
      choose(results[activeIndex]);
    }
  };

  const optionId = (index) => `${listId}-option-${index}`;

  return (
    <Modal title="Search messages" onClose={onClose} size="lg">
      <div className="input-group search-input">
        <Search size={18} className="input-group__icon" aria-hidden="true" />
        <input
          className="input"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Search messages in your channels and DMs"
          aria-label="Search messages"
          role="combobox"
          aria-expanded={results.length > 0}
          aria-controls={listId}
          aria-activedescendant={results.length > 0 ? optionId(activeIndex) : undefined}
          autoComplete="off"
          data-autofocus
        />
      </div>

      <div className="search-results" aria-live="polite">
        {status === "idle" && (
          <p className="modal__status">Type at least {MIN_QUERY_LENGTH} characters to search.</p>
        )}
        {status === "loading" && (
          <div className="modal__status" role="status">
            <span className="spinner spinner--sm modal__spinner" aria-hidden="true" />
            Searching…
          </div>
        )}
        {status === "error" && (
          <p className="modal__status modal__status--error" role="alert">
            Search failed. Please try again.
          </p>
        )}
        {status === "ready" && results.length === 0 && (
          <p className="modal__status">No messages match “{trimmed}”.</p>
        )}

        {status === "ready" && results.length > 0 && (
          <ul id={listId} className="search-list" role="listbox" aria-label="Search results">
            {results.map((message, index) => {
              const isDirectMessage = message.channel?.id?.startsWith("!members-");
              const where = isDirectMessage ? "Direct message" : `#${message.channel?.name || message.channel?.id}`;
              return (
                <li
                  key={message.id}
                  id={optionId(index)}
                  role="option"
                  aria-selected={index === activeIndex}
                  className={`search-item ${index === activeIndex ? "is-active" : ""}`}
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => choose(message)}
                >
                  <span className="search-item__where">
                    {isDirectMessage ? <MessageCircle size={13} aria-hidden="true" /> : <Hash size={13} aria-hidden="true" />}
                    {where.replace(/^#/, "")}
                  </span>
                  <span className="search-item__text">
                    <Highlight text={message.text || ""} query={trimmed} />
                  </span>
                  <span className="search-item__meta">
                    {message.user?.name || message.user?.id} · {formatWhen(message.created_at)}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <p className="search-hint" aria-hidden="true">
        <kbd>↑</kbd> <kbd>↓</kbd> to navigate · <kbd>Enter</kbd> to open · <kbd>Esc</kbd> to close
      </p>
    </Modal>
  );
};

export default SearchModal;
