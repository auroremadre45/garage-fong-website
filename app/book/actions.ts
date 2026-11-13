"use server";
import { createClient } from "@/lib/supabase/server";

export type Result = { ok: boolean; message: string };

export async function getSlots(serviceId: string, date: string): Promise<string[]> {
  if (!serviceId || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return [];
  const { data } = await createClient().rpc("available_slots", { p_service: serviceId, p_date: date });
  return (data ?? []).map((r: { slot: string }) => r.slot);
}

export async function bookAppointment(fd: FormData): Promise<Result> {
  const g = (k: string) => String(fd.get(k) ?? "").trim();
  const { error } = await createClient().rpc("book_appointment", {
    p_service: g("service_id"), p_start: g("starts_at"), p_name: g("name"),
    p_phone: g("phone"), p_car: g("car"), p_notes: g("notes"),
  });
  if (error?.message.includes("slot_unavailable")) return { ok: false, message: "That time was just taken. Please pick another." };
  if (error) return { ok: false, message: "Please check your details, or call us on 454 5822." };
  return { ok: true, message: "Your appointment is booked. We will call to confirm if anything needs changing." };
}
