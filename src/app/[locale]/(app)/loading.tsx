export default function Loading() {
  return (
    <div className="card empty-state" role="status" aria-live="polite">
      <div>
        <div style={{ fontSize: 20 }}>...</div>
        <p className="muted">Loading workspace...</p>
      </div>
    </div>
  );
}
