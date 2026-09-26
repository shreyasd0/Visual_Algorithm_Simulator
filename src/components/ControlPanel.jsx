export default function ControlPanel({ title, children, actions }) {
  return (
    <section className="panel control-panel">
      <div className="panel-header-row">
        <h3>{title}</h3>
        {actions && <div className="panel-actions">{actions}</div>}
      </div>
      <div className="control-grid">{children}</div>
    </section>
  );
}
