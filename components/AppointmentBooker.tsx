"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { bookAppointment, getSlots, type Result } from "@/app/book/actions";
import { fmtDateTime, fmtPrice, fmtTime, todayMU } from "@/lib/format";

export type Service = { id: string; name: string; description: string | null; duration_min: number; price_mur: number | null };
const field = "w-full border border-rule bg-white px-3 py-2.5 rounded-sm";

export default function AppointmentBooker({ services }: { services: Service[] }) {
  const [serviceId, setServiceId] = useState(services[0]?.id ?? "");
  const [date, setDate] = useState(todayMU());
  const [slots, setSlots] = useState<string[] | null>(null);
  const [slot, setSlot] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const service = services.find((s) => s.id === serviceId);

  async function load() {
    setSlot(""); setSlots(null);
    setSlots(await getSlots(serviceId, date));
  }
  useEffect(() => { if (serviceId) load(); /* eslint-disable-next-line */ }, [serviceId, date]);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    fd.set("service_id", serviceId); fd.set("starts_at", slot);
    setBusy(true);
    const r = await bookAppointment(fd);
    setBusy(false); setResult(r);
    if (!r.ok) load();
  }

  if (result?.ok) {
    return (
      <div role="status" className="border-l-4 border-amber bg-white p-6">
        <p className="font-display font-bold text-xl">Booked: {service?.name}</p>
        <p className="mt-1 text-lg">{fmtDateTime(slot)}</p>
        <p className="mt-3">{result.message}</p>
        <p className="mt-3 text-sm">Sign in on the <Link className="underline" href="/login">account page</Link> with the same email to see or cancel it later.</p>
      </div>
    );
  }
  if (!services.length) return <p>No services are open for booking yet. Please call 454 5822.</p>;

  return (
    <form onSubmit={submit} className="grid gap-8">
      <fieldset className="grid gap-4 sm:grid-cols-2">
        <legend className="font-display font-bold text-xl mb-3">1. What does the car need?</legend>
        <label className="grid gap-1">Service
          <select value={serviceId} onChange={(e) => setServiceId(e.target.value)} className={field}>
            {services.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </label>
        <label className="grid gap-1">Date
          <input type="date" min={todayMU()} value={date} onChange={(e) => setDate(e.target.value)} className={field} />
        </label>
        {service && <p className="sm:col-span-2 text-sm text-ink/80">{service.description} About {service.duration_min} minutes. {fmtPrice(service.price_mur)}.</p>}
      </fieldset>

      <fieldset>
        <legend className="font-display font-bold text-xl mb-3">2. Pick a time</legend>
        {slots === null && <p>Checking free times…</p>}
        {slots && slots.length === 0 && <p>No free times on this date. We are closed on Sundays and Saturday afternoons. Try another day.</p>}
        <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Available times">
          {slots?.map((s) => (
            <button type="button" key={s} role="radio" aria-checked={slot === s} onClick={() => setSlot(s)}
              className={`px-4 py-2 border rounded-sm ${slot === s ? "bg-shop text-chalk border-shop" : "bg-white border-rule hover:border-shop"}`}>
              {fmtTime(s)}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset className="grid gap-4 sm:grid-cols-2">
        <legend className="font-display font-bold text-xl mb-3">3. Your details</legend>
        <label className="grid gap-1">Name<input name="name" required minLength={2} autoComplete="name" className={field} /></label>
        <label className="grid gap-1">Phone<input name="phone" type="tel" required autoComplete="tel" className={field} /></label>
        <label className="grid gap-1 sm:col-span-2">Car (make, model, year)<input name="car" required placeholder="Peugeot 208, 2018" className={field} /></label>
        <label className="grid gap-1 sm:col-span-2">What is the car doing? (optional)<textarea name="notes" rows={3} maxLength={1000} className={field} /></label>
      </fieldset>

      {result && !result.ok && <p role="alert" className="text-red-700">{result.message}</p>}
      <div>
        <button disabled={!slot || busy} className="bg-amber text-ink font-display font-bold px-6 py-3 rounded-sm disabled:opacity-50">
          {busy ? "Booking…" : slot ? `Book ${fmtTime(slot)}` : "Pick a time to continue"}
        </button>
      </div>
    </form>
  );
}
