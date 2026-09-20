"use client";

import { useState } from "react";

export default function AdminRetryPush({ bookingId }: { bookingId: string }) {
  const [busy, setBusy] = useState(false);
  async function retry() {
    setBusy(true);
    await fetch(`/api/admin/bookings/${bookingId}/push`, { method: "POST" });
    window.location.reload();
  }
  return <button type="button" disabled={busy} onClick={retry} className="mt-2 text-xs font-semibold text-terracotta underline">{busy ? "Retrying…" : "Retry push to Hospitable"}</button>;
}
