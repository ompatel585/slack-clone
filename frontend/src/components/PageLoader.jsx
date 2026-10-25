const PageLoader = ({ label = "Loading your workspace…" }) => {
  return (
    <div className="page-loader" role="status" aria-live="polite">
      <img src="/logo.png" alt="" className="page-loader__logo" />
      <div className="spinner" aria-hidden="true" />
      <p className="page-loader__label">{label}</p>
    </div>
  );
};

export default PageLoader;
