"use client";

import { useState } from "react";

export default function AdminLogin() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  async function login(event: React.FormEvent) {
    event.preventDefault();
    const response = await fetch("/api/admin/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password }) });
    if (response.ok) window.location.reload(); else setError("Incorrect password.");
  }
  return <main className="flex min-h-[75vh] items-center justify-center px-5"><form onSubmit={login} className="w-full max-w-sm rounded-3xl bg-white p-8 shadow-[0_18px_60px_rgba(32,61,49,0.1)]"><p className="eyebrow">Private access</p><h1 className="mt-2 font-display text-4xl text-forest">Owner login</h1><label className="mt-8 block text-sm font-semibold text-forest">Password<input required type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="mt-2 w-full rounded-xl border border-ink/15 px-4 py-3 outline-none focus:ring-2 focus:ring-forest/30" /></label>{error && <p className="mt-3 text-sm text-rose-700">{error}</p>}<button className="mt-6 w-full rounded-full bg-forest py-3 font-semibold text-white">Continue</button></form></main>;
}
