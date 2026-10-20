import { useEffect, useState, type ReactNode } from 'react';

type Props<T> = {
  title: string;
  description: string;
  emptyText: string;
  loadItems: () => Promise<T[]>;
  renderItems: (items: T[]) => ReactNode;
};

export function CapabilityCard<T>({ title, description, emptyText, loadItems, renderItems }: Props<T>) {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(false);
    loadItems()
      .then((results) => {
        if (active) setItems(results);
      })
      .catch(() => {
        if (active) setError(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [loadItems]);

  return (
    <section className="card h-100">
      <div className="card-body">
        <h2 className="h4">{title}</h2>
        <p>{description}</p>
        {loading ? <p role="status">Loading {title.toLowerCase()}...</p> : null}
        {!loading && error ? <p role="alert">Unable to load {title.toLowerCase()}.</p> : null}
        {!loading && !error && items.length === 0 ? <p>{emptyText}</p> : null}
        {!loading && !error && items.length > 0 ? renderItems(items) : null}
      </div>
    </section>
  );
}
