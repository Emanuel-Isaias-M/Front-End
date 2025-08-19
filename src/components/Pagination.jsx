export default function Pagination({ page, total, onChange }) {
  if (!total || total <= 1) return null;

  const go = (p) => onChange(Math.min(Math.max(1, p), total));
  const windowSize = 5;
  const start = Math.max(1, page - Math.floor(windowSize / 2));
  const end = Math.min(total, start + windowSize - 1);
  const pages = Array.from({ length: end - start + 1 }, (_, i) => start + i);

  return (
    <div className="flex items-center justify-center gap-1 mt-6">
      <button className="px-3 py-1 border rounded disabled:opacity-50" onClick={() => go(1)} disabled={page === 1}>«</button>
      <button className="px-3 py-1 border rounded disabled:opacity-50" onClick={() => go(page - 1)} disabled={page === 1}>‹</button>
      {pages.map((p) => (
        <button
          key={p}
          onClick={() => go(p)}
          className={`px-3 py-1 border rounded ${p === page ? "bg-neutral-900 text-white dark:bg-white dark:text-black" : ""}`}
        >
          {p}
        </button>
      ))}
      <button className="px-3 py-1 border rounded disabled:opacity-50" onClick={() => go(page + 1)} disabled={page === total}>›</button>
      <button className="px-3 py-1 border rounded disabled:opacity-50" onClick={() => go(total)} disabled={page === total}>»</button>
    </div>
  );
}
