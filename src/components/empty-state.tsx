export function EmptyState({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="empty-state">
      <div>
        <div style={{ fontSize: 32, marginBottom: 10 }}>◇</div>
        <strong>{title}</strong>
        {description ? <p className="muted">{description}</p> : null}
      </div>
    </div>
  );
}
