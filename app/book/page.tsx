import AppointmentBooker from "@/components/AppointmentBooker";
import PageShell from "@/components/PageShell";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const metadata = { title: "Book an appointment | Garage Fong" };

export default async function Book() {
  const { data } = await createClient().from("services").select("id,name,description,duration_min,price_mur").eq("active", true).order("name");
  return (
    <PageShell title="Book an appointment" intro="Choose a service and a free time. You are booked straight away, no waiting for a call back.">
      <AppointmentBooker services={data ?? []} />
    </PageShell>
  );
}
