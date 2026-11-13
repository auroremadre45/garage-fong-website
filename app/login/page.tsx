import { redirect } from "next/navigation";
import PageShell from "@/components/PageShell";
import { createClient } from "@/lib/supabase/server";

async function signIn(fd: FormData) {
  "use server";
  const { error } = await createClient().auth.signInWithPassword({ email: String(fd.get("email")), password: String(fd.get("password")) });
  redirect(error ? "/login?msg=bad" : "/account");
}
async function signUp(fd: FormData) {
  "use server";
  const { data, error } = await createClient().auth.signUp({ email: String(fd.get("email")), password: String(fd.get("password")) });
  if (error) redirect("/login?msg=signup-failed");
  redirect(data.session ? "/account" : "/login?msg=confirm");
}

const msgs: Record<string, string> = {
  bad: "Email or password is incorrect.",
  "signup-failed": "Could not create the account. Use a valid email and a password of at least 6 characters.",
  confirm: "Check your email and click the confirmation link, then log in.",
};
const field = "border border-rule bg-white px-3 py-2.5 rounded-sm";

export default function Login({ searchParams }: { searchParams: { msg?: string } }) {
  const m = searchParams.msg && msgs[searchParams.msg];
  return (
    <PageShell title="Your account" intro="See or cancel your appointments and parts orders. Staff also log in here.">
      {m && <p role="status" className="mb-6 border-l-4 border-amber bg-white p-3">{m}</p>}
      <div className="grid gap-8 md:grid-cols-2">
        {([["Log in", signIn], ["Create account", signUp]] as const).map(([label, action]) => (
          <form key={label} action={action} className="grid gap-4 bg-white border border-rule p-5 rounded-sm h-fit">
            <h2 className="font-display font-bold text-xl">{label}</h2>
            <label className="grid gap-1">Email<input name="email" type="email" required autoComplete="email" className={field} /></label>
            <label className="grid gap-1">Password<input name="password" type="password" required minLength={6} autoComplete={label === "Log in" ? "current-password" : "new-password"} className={field} /></label>
            <button className="bg-shop text-chalk font-display font-bold py-3 rounded-sm">{label}</button>
          </form>
        ))}
      </div>
    </PageShell>
  );
}
