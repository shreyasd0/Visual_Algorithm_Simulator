export default function AlgorithmTable({ columns, rows }) {
  if (!rows || rows.length === 0) {
    return <p className="empty-state">No calculation data available yet.</p>;
  }

  return (
    <div className="table-wrap">
      <table className="algorithm-table">
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.key}>{column.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={`${row.key ?? index}`}>
              {columns.map((column) => (
                <td key={`${row.key ?? index}-${column.key}`}>{row[column.key]}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
