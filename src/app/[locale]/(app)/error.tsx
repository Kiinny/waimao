"use client";

export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="card empty-state" role="alert">
      <div>
        <h2>We could not load this view</h2>
        <p className="muted">Please try again. If it continues, contact your administrator.</p>
        <button className="button" type="button" onClick={reset}>
          Try again
        </button>
      </div>
    </div>
  );
}
