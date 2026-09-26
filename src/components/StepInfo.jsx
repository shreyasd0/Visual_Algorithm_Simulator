export default function StepInfo({ title, details = [] }) {
  return (
    <section className="panel detail-panel">
      <h3>{title}</h3>
      <ul className="detail-list">
        {details.map((item) => (
          <li key={item.label}>
            <span>{item.label}</span>
            <strong>{item.value}</strong>
          </li>
        ))}
      </ul>
    </section>
  );
}
