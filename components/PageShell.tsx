import Link from "next/link";
export default function PageShell({ title, intro, children }: { title: string; intro?: string; children: React.ReactNode }) {
  return (
    <>
      <header className="bg-shop text-chalk">
        <nav className="mx-auto max-w-6xl flex items-center justify-between px-5 py-4">
          <Link href="/" className="font-display font-extrabold text-xl">Garage Fong</Link>
          <div className="flex gap-5 text-sm"><Link href="/book">Book</Link><Link href="/shop">Parts</Link><Link href="/login">Account</Link></div>
        </nav>
      </header>
      <main className="mx-auto max-w-4xl px-5 py-12">
        <h1 className="font-display font-extrabold text-4xl">{title}</h1>
        {intro && <p className="mt-2 mb-10 max-w-xl">{intro}</p>}
        {children}
      </main>
    </>
  );
}
