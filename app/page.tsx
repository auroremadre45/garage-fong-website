import Link from "next/link";
import { business as b } from "@/lib/business";

export default function Home() {
  return (
    <>
      <header className="bg-shop text-chalk">
        <nav className="mx-auto max-w-6xl flex items-center justify-between px-5 py-4">
          <span className="font-display font-extrabold text-xl tracking-tight">Garage Fong</span>
          <div className="flex items-center gap-5 text-sm">
            <a href="#hours" className="hidden sm:inline hover:underline">Hours</a>
            <Link href="/shop" className="hidden sm:inline hover:underline">Parts</Link>
            <Link href="/login" className="hidden sm:inline hover:underline">Account</Link>
            <a href={b.phoneHref} className="bg-amber text-ink font-semibold px-4 py-2 rounded-sm">Call {b.phone.replace("+230 ", "")}</a>
          </div>
        </nav>

        <div className="mx-auto max-w-6xl px-5 pb-16 pt-10 grid gap-10 lg:grid-cols-[1.2fr_1fr] items-center">
          <div>
            <h1 className="font-display font-extrabold text-4xl sm:text-6xl leading-[1.02] tracking-tight">
              Your mechanic tells you what he found, and what he fixed.
            </h1>
            <p className="mt-6 text-lg max-w-xl text-chalk/85">
              Father-and-son garage in Rose Hill. Over 80 years of combined experience, rated {b.rating} from {b.reviewCount} Google reviews.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/book" className="bg-amber text-ink font-display font-bold px-6 py-3 rounded-sm">Book a service</Link>
              <a href={b.mapsUrl} className="border border-chalk/50 px-6 py-3 rounded-sm">Get directions</a>
            </div>
          </div>

          {/* The memorable element: a repair order, as the garage would hand it back */}
          <aside aria-label="Example repair order" className="bg-chalk text-ink rounded-sm p-6 shadow-xl rotate-1">
            <p className="font-display font-bold text-sm">Repair order · what you get back</p>
            <dl className="mt-4 divide-y divide-rule text-sm">
              {[["Found", "Worn part, explained in plain words"],["Replaced", "Only what the car needed"],["Watch", "What to keep an eye on next"],["Parts", "Ours, or bring your own"]].map(([k, v]) => (
                <div key={k} className="grid grid-cols-[5rem_1fr] py-2.5"><dt className="font-semibold">{k}</dt><dd>{v}</dd></div>
              ))}
            </dl>
          </aside>
        </div>
      </header>

      <main>
        <section className="mx-auto max-w-6xl px-5 py-16">
          <h2 className="font-display font-extrabold text-3xl">What customers say</h2>
          <div className="mt-8 grid gap-6 md:grid-cols-2">
            {b.reviews.map((r, i) => (
              <figure key={i} className={`border-l-4 ${i % 2 ? "border-amber" : "border-shop"} pl-5 py-1`}>
                <blockquote className="text-lg leading-relaxed">{r.text}</blockquote>
                <figcaption className="mt-2 text-sm text-ink/70">{r.who}</figcaption>
              </figure>
            ))}
          </div>
        </section>

        <section className="bg-white border-y border-rule">
          <div className="mx-auto max-w-6xl px-5 py-16 grid gap-12 md:grid-cols-2">
            <div>
              <h2 className="font-display font-extrabold text-3xl">What we do</h2>
              <ul className="mt-6 space-y-3 text-lg">
                {b.services.slice(0, 4).map((s) => <li key={s} className="border-b border-rule pb-3">{s}</li>)}
              </ul>
              <p className="mt-5 text-ink/80">Appointments keep the queue short. Walk-ins are welcome when there is room.</p>
            </div>
            <div id="hours">
              <h2 className="font-display font-extrabold text-3xl">Opening hours</h2>
              <table className="mt-6 w-full text-left">
                <tbody>
                  {b.hours.map((h) => (
                    <tr key={h.day} className="border-b border-rule"><th scope="row" className="py-2.5 font-medium">{h.day}</th><td className="py-2.5">{h.time}</td></tr>
                  ))}
                </tbody>
              </table>
              <p className="mt-5">{b.address}<br /><a className="underline" href={b.mapsUrl}>Open in Google Maps</a></p>
            </div>
          </div>
        </section>

        <section id="book" className="mx-auto max-w-6xl px-5 py-16 grid gap-6 md:grid-cols-2">
          <Link href="/book" className="block border-2 border-shop p-6 rounded-sm hover:bg-white">
            <h2 className="font-display font-extrabold text-2xl">Book an appointment</h2>
            <p className="mt-2">Pick a service and a free time. You are booked straight away.</p>
          </Link>
          <Link href="/shop" className="block border-2 border-rule p-6 rounded-sm hover:bg-white">
            <h2 className="font-display font-extrabold text-2xl">Reserve parts for pickup</h2>
            <p className="mt-2">Oil, filters and more. Reserve online, pay when you collect.</p>
          </Link>
        </section>
      </main>

      <footer className="bg-ink text-chalk">
        <div className="mx-auto max-w-6xl px-5 py-8 flex flex-wrap justify-between gap-4 text-sm">
          <span>© {new Date().getFullYear()} Garage Fong, Rose Hill</span>
          <a href={b.phoneHref}>{b.phone}</a>
          <Link href="/login" className="opacity-70 hover:opacity-100">Account</Link>
        </div>
      </footer>
    </>
  );
}
