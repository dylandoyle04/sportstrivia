export default function ComingSoon({ title, onBack }) {
  return (
    <div className="home">
      <button className="back-btn" onClick={onBack}>← Back</button>
      <h1>{title}</h1>
      <p className="sub">Coming soon.</p>
      <div className="placeholder">
        <p>This mode is still being built.</p>
      </div>
    </div>
  );
}
