import { MessagesSquare } from "lucide-react";

/**
 * Centered illustration + copy for "nothing here yet" moments.
 * `icon` is an element (e.g. <Hash />) so callers control its size.
 */
const EmptyState = ({ icon = <MessagesSquare size={28} />, title, description, action, tone = "light" }) => {
  return (
    <div className={`empty-state empty-state--${tone}`}>
      <div className="empty-state__icon" aria-hidden="true">
        {icon}
      </div>
      <h2 className="empty-state__title">{title}</h2>
      {description && <p className="empty-state__description">{description}</p>}
      {action && <div className="empty-state__action">{action}</div>}
    </div>
  );
};

export default EmptyState;
