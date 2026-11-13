import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import PageShell from "@/components/PageShell";
import { createClient } from "@/lib/supabase/server";
import { fmtDateTime } from "@/lib/format";

export const dynamic = "force-dynamic";

async function cancel(fd: FormData) {
  "use server";
  await createClient().rpc("cancel_my_appointment", { p_id: String(fd.get("id")) });
  revalidatePath("/account");
}
async function signOut() {
  "use server";
  await createClient().auth.signOut();
  redirect("/login");
}

export default async function Account() {
  const sb = createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect("/login");
  const [{ data: appts }, { data: orders }, { data: isAdmin }] = await Promise.all([
    sb.from("appointments").select("id,starts_at,status,car,services(name)").eq("user_id", user.id).order("starts_at", { ascending: false }),
    sb.from("orders").select("id,status,created_at,order_items(qty,product_name)").eq("user_id", user.id).order("created_at", { ascending: false }),
    sb.rpc("is_admin"),
  ]);
  return (
    <PageShell title="Your bookings">
      <div className="flex gap-6 -mt-6 mb-8 text-sm">
        <span>{user.email}</span>
        {isAdmin && <Link href="/admin" className="underline font-semibold">Open staff dashboard</Link>}
        <form action={signOut}><button className="underline">Log out</button></form>
      </div>

      <h2 className="font-display font-bold text-2xl mb-3">Appointments</h2>
      {!appts?.length ? <p>None yet. <Link className="underline" href="/book">Book an appointment</Link>.</p> : (
        <ul className="grid gap-3">
          {appts.map((a: any) => (
            <li key={a.id} className="bg-white border border-rule p-4 rounded-sm flex justify-between gap-4 items-center">
              <div><p className="font-semibold">{a.services?.name} · {fmtDateTime(a.starts_at)}</p><p className="text-sm">{a.car} · {a.status}</p></div>
              {["pending", "confirmed"].includes(a.status) && new Date(a.starts_at) > new Date() && (
                <form action={cancel}><input type="hidden" name="id" value={a.id} /><button className="underline text-sm">Cancel</button></form>
              )}
            </li>
          ))}
        </ul>
      )}

      <h2 className="font-display font-bold text-2xl mt-10 mb-3">Parts orders</h2>
      {!orders?.length ? <p>None yet. <Link className="underline" href="/shop">Reserve parts</Link>.</p> : (
        <ul className="grid gap-3">
          {orders.map((o: any) => (
            <li key={o.id} className="bg-white border border-rule p-4 rounded-sm">
              <p className="font-semibold">{o.order_items.map((i: any) => `${i.qty} × ${i.product_name}`).join(", ")}</p>
              <p className="text-sm">{fmtDateTime(o.created_at)} · {o.status}. To change an order, call 454 5822.</p>
            </li>
          ))}
        </ul>
      )}
    </PageShell>
  );
}
