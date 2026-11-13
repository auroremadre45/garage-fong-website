import Shop from "@/components/Shop";
import PageShell from "@/components/PageShell";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const metadata = { title: "Parts for pickup | Garage Fong" };

export default async function ShopPage() {
  const { data } = await createClient().from("products").select("id,name,description,price_mur,stock").eq("active", true).order("name");
  return (
    <PageShell title="Parts for pickup" intro="Reserve what you need and collect it at the garage. You pay when you collect.">
      <Shop products={data ?? []} />
    </PageShell>
  );
}
