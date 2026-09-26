export default function CalculationPanel({ title, formula, values }) {
  return (
    <section className="panel calculation-panel">
      <h3>{title}</h3>
      <div className="formula-box">{formula}</div>
      <div className="value-grid">
        {values.map((item) => (
          <div key={item.label} className="value-item">
            <span>{item.label}</span>
            <strong>{item.value}</strong>
          </div>
        ))}
      </div>
    </section>
  );
}
