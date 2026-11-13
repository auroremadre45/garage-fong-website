const TZ = "Indian/Mauritius";
export const fmtTime = (iso: string) => new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: TZ });
export const fmtDateTime = (iso: string) =>
  new Date(iso).toLocaleString("en-GB", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: TZ });
export const fmtPrice = (n: number | null) => (n == null ? "Price confirmed on call" : `Rs ${Number(n).toLocaleString("en-GB")}`);
export const todayMU = () => new Date().toLocaleDateString("en-CA", { timeZone: TZ });
