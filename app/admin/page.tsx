import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import PageShell from "@/components/PageShell";
import { createClient } from "@/lib/supabase/server";
import { fmtDateTime, fmtPrice } from "@/lib/format";

export const dynamic = "force-dynamic";

async function admin() {
  const sb = createClient();
  const { data } = await sb.rpc("is_admin");
  if (!data) redirect("/account");
  return sb;
}
const num = (v: FormDataEntryValue | null) => (String(v ?? "").trim() === "" ? null : Number(v));
const done = () => revalidatePath("/admin");

async function apptStatus(fd: FormData) { "use server"; const sb = await admin(); await sb.from("appointments").update({ status: String(fd.get("status")) }).eq("id", String(fd.get("id"))); done(); }
async function orderStatus(fd: FormData) { "use server"; const sb = await admin(); await sb.rpc("admin_set_order_status", { p_id: String(fd.get("id")), p_status: String(fd.get("status")) }); done(); }
async function addService(fd: FormData) { "use server"; const sb = await admin(); await sb.from("services").insert({ name: String(fd.get("name")), description: String(fd.get("description") || "") || null, duration_min: Number(fd.get("duration_min")), price_mur: num(fd.get("price_mur")) }); done(); }
async function toggleService(fd: FormData) { "use server"; const sb = await admin(); await sb.from("services").update({ active: fd.get("active") !== "true" }).eq("id", String(fd.get("id"))); done(); }
async function addProduct(fd: FormData) { "use server"; const sb = await admin(); await sb.from("products").insert({ name: String(fd.get("name")), description: String(fd.get("description") || "") || null, price_mur: num(fd.get("price_mur")), stock: Number(fd.get("stock") || 0) }); done(); }
async function updateProduct(fd: FormData) { "use server"; const sb = await admin(); await sb.from("products").update({ stock: Number(fd.get("stock")), price_mur: num(fd.get("price_mur")), active: fd.get("active") === "on" }).eq("id", String(fd.get("id"))); done(); }

const input = "border border-rule bg-white px-2 py-1.5 rounded-sm";
const btn = "bg-shop text-chalk px-3 py-1.5 rounded-sm";
const h2 = "font-display font-bold text-2xl mt-12 mb-3";

export default async function Admin() {
  const sb = await admin();
  const since = new Date(Date.now() - 864e5).toISOString();
  const [{ data: appts }, { data: orders }, { data: services }, { data: products }] = await Promise.all([
    sb.from("appointments").select("*, services(name)").gte("ends_at", since).order("starts_at"),
    sb.from("orders").select("*, order_items(qty, product_name, unit_price_mur)").order("created_at", { ascending: false }).limit(50),
    sb.from("services").select("*").order("name"),
    sb.from("products").select("*").order("name"),
  ]);
  return (
    <PageShell title="Staff dashboard">
      <h2 className={h2}>Upcoming appointments</h2>
      {!appts?.length && <p>No upcoming appointments. New bookings appear here automatically.</p>}
      <ul className="grid gap-3">
        {appts?.map((a: any) => (
          <li key={a.id} className="bg-white border border-rule p-4 rounded-sm grid gap-2 sm:grid-cols-[1fr_auto]">
            <div>
              <p className="font-semibold">{fmtDateTime(a.starts_at)} · {a.services?.name}</p>
              <p>{a.name} · <a className="underline" href={`tel:${a.phone}`}>{a.phone}</a> · {a.car}</p>
              {a.notes && <p className="text-sm text-ink/80">{a.notes}</p>}
            </div>
            <form action={apptStatus} className="flex gap-2 items-start">
              <input type="hidden" name="id" value={a.id} />
              <select name="status" defaultValue={a.status} className={input}>{["pending", "confirmed", "done", "cancelled", "no_show"].map((s) => <option key={s}>{s}</option>)}</select>
              <button className={btn}>Save</button>
            </form>
          </li>
        ))}
      </ul>

      <h2 className={h2}>Parts orders</h2>
      {!orders?.length && <p>No orders yet.</p>}
      <ul className="grid gap-3">
        {orders?.map((o: any) => (
          <li key={o.id} className="bg-white border border-rule p-4 rounded-sm grid gap-2 sm:grid-cols-[1fr_auto]">
            <div>
              <p className="font-semibold">{o.order_items.map((i: any) => `${i.qty} × ${i.product_name}`).join(", ")}</p>
              <p>{o.name} · <a className="underline" href={`tel:${o.phone}`}>{o.phone}</a> · {fmtDateTime(o.created_at)}</p>
              {o.note && <p className="text-sm text-ink/80">{o.note}</p>}
            </div>
            <form action={orderStatus} className="flex gap-2 items-start">
              <input type="hidden" name="id" value={o.id} />
              <select name="status" defaultValue={o.status} className={input}>{["new", "ready", "collected", "cancelled"].map((s) => <option key={s}>{s}</option>)}</select>
              <button className={btn}>Save</button>
            </form>
          </li>
        ))}
      </ul>
      <p className="text-sm mt-2">Cancelling an order puts its items back in stock.</p>

      <h2 className={h2}>Services</h2>
      <ul className="grid gap-2">
        {services?.map((s: any) => (
          <li key={s.id} className="bg-white border border-rule p-3 rounded-sm flex justify-between items-center gap-3">
            <span>{s.name} · {s.duration_min} min · {fmtPrice(s.price_mur)} {!s.active && "(hidden)"}</span>
            <form action={toggleService}><input type="hidden" name="id" value={s.id} /><input type="hidden" name="active" value={String(s.active)} /><button className="underline text-sm">{s.active ? "Hide" : "Show"}</button></form>
          </li>
        ))}
      </ul>
      <form action={addService} className="mt-4 flex flex-wrap gap-2 items-end">
        <input name="name" required placeholder="Service name" className={input} />
        <input name="description" placeholder="Short description" className={input} />
        <input name="duration_min" type="number" min={15} step={15} required placeholder="Minutes" className={`${input} w-24`} />
        <input name="price_mur" type="number" min={0} placeholder="Price Rs (optional)" className={`${input} w-40`} />
        <button className={btn}>Add service</button>
      </form>

      <h2 className={h2}>Products</h2>
      <ul className="grid gap-2">
        {products?.map((p: any) => (
          <li key={p.id} className="bg-white border border-rule p-3 rounded-sm">
            <form action={updateProduct} className="flex flex-wrap gap-3 items-center">
              <input type="hidden" name="id" value={p.id} />
              <span className="min-w-48 font-medium">{p.name}</span>
              <label className="text-sm">Stock <input name="stock" type="number" min={0} defaultValue={p.stock} className={`${input} w-20`} /></label>
              <label className="text-sm">Price Rs <input name="price_mur" type="number" min={0} defaultValue={p.price_mur ?? ""} className={`${input} w-28`} /></label>
              <label className="text-sm flex gap-1 items-center"><input name="active" type="checkbox" defaultChecked={p.active} /> Visible</label>
              <button className={btn}>Save</button>
            </form>
          </li>
        ))}
      </ul>
      <form action={addProduct} className="mt-4 flex flex-wrap gap-2 items-end">
        <input name="name" required placeholder="Product name" className={input} />
        <input name="description" placeholder="Short description" className={input} />
        <input name="price_mur" type="number" min={0} placeholder="Price Rs (optional)" className={`${input} w-40`} />
        <input name="stock" type="number" min={0} required placeholder="Stock" className={`${input} w-24`} />
        <button className={btn}>Add product</button>
      </form>
    </PageShell>
  );
}
