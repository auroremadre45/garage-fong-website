"use server";
import { createClient } from "@/lib/supabase/server";
import type { Result } from "@/app/book/actions";

export async function placeOrder(items: { product_id: string; qty: number }[], fd: FormData): Promise<Result> {
  const g = (k: string) => String(fd.get(k) ?? "").trim();
  const { error } = await createClient().rpc("place_order", {
    p_name: g("name"), p_phone: g("phone"), p_note: g("note"), p_items: items,
  });
  if (error?.message.includes("out_of_stock")) return { ok: false, message: "One item just ran out of stock. Please refresh and adjust your basket." };
  if (error) return { ok: false, message: "Please check your details, or call us on 454 5822." };
  return { ok: true, message: "Order received. We will call you when it is ready to collect. Payment is at pickup." };
}
