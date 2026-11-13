"use client";
import { useState } from "react";
import { placeOrder } from "@/app/shop/actions";
import type { Result } from "@/app/book/actions";
import { fmtPrice } from "@/lib/format";

export type Product = { id: string; name: string; description: string | null; price_mur: number | null; stock: number };
const field = "w-full border border-rule bg-white px-3 py-2.5 rounded-sm";

export default function Shop({ products }: { products: Product[] }) {
  const [cart, setCart] = useState<Record<string, number>>({});
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const lines = products.filter((p) => cart[p.id] > 0);
  const total = lines.reduce((t, p) => t + (p.price_mur ?? 0) * cart[p.id], 0);
  const unpriced = lines.some((p) => p.price_mur == null);
  const change = (p: Product, d: number) =>
    setCart((c) => ({ ...c, [p.id]: Math.max(0, Math.min(p.stock, 20, (c[p.id] ?? 0) + d)) }));

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    const r = await placeOrder(lines.map((p) => ({ product_id: p.id, qty: cart[p.id] })), new FormData(e.currentTarget));
    setBusy(false); setResult(r);
    if (r.ok) setCart({});
  }

  if (result?.ok) return <div role="status" className="border-l-4 border-amber bg-white p-6"><p className="font-display font-bold text-xl">Order received</p><p className="mt-2">{result.message}</p></div>;
  if (!products.length) return <p>No products are listed for pickup yet. Please call 454 5822.</p>;

  return (
    <div className="grid gap-10 lg:grid-cols-[1.3fr_1fr]">
      <ul className="grid gap-4">
        {products.map((p) => (
          <li key={p.id} className="bg-white border border-rule p-4 rounded-sm flex items-center justify-between gap-4">
            <div>
              <p className="font-semibold">{p.name}</p>
              {p.description && <p className="text-sm text-ink/80">{p.description}</p>}
              <p className="mt-1 text-sm">{fmtPrice(p.price_mur)} · {p.stock > 0 ? `${p.stock} in stock` : "Out of stock"}</p>
            </div>
            <div className="flex items-center gap-2" aria-label={`Quantity of ${p.name}`}>
              <button type="button" onClick={() => change(p, -1)} aria-label="Remove one" className="w-9 h-9 border border-rule rounded-sm">−</button>
              <span className="w-6 text-center" aria-live="polite">{cart[p.id] ?? 0}</span>
              <button type="button" onClick={() => change(p, 1)} disabled={p.stock === 0} aria-label="Add one" className="w-9 h-9 bg-shop text-chalk rounded-sm disabled:opacity-40">+</button>
            </div>
          </li>
        ))}
      </ul>

      <form onSubmit={submit} className="bg-white border border-rule p-5 rounded-sm grid gap-4 h-fit">
        <h2 className="font-display font-bold text-xl">Your pickup order</h2>
        {lines.length === 0 ? <p className="text-sm">Add items to start an order.</p> : (
          <ul className="text-sm divide-y divide-rule">
            {lines.map((p) => <li key={p.id} className="py-2 flex justify-between"><span>{cart[p.id]} × {p.name}</span><span>{p.price_mur == null ? "TBC" : `Rs ${(p.price_mur * cart[p.id]).toLocaleString("en-GB")}`}</span></li>)}
          </ul>
        )}
        {lines.length > 0 && <p className="font-semibold">Total: Rs {total.toLocaleString("en-GB")}{unpriced && " + items to confirm"}</p>}
        <label className="grid gap-1">Name<input name="name" required minLength={2} className={field} autoComplete="name" /></label>
        <label className="grid gap-1">Phone<input name="phone" type="tel" required className={field} autoComplete="tel" /></label>
        <label className="grid gap-1">Car model or note (optional)<textarea name="note" rows={2} className={field} /></label>
        {result && !result.ok && <p role="alert" className="text-red-700">{result.message}</p>}
        <button disabled={!lines.length || busy} className="bg-amber text-ink font-display font-bold px-6 py-3 rounded-sm disabled:opacity-50">{busy ? "Sending…" : "Reserve for pickup"}</button>
        <p className="text-xs text-ink/70">Pay at the garage when you collect.</p>
      </form>
    </div>
  );
}
