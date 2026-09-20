import Link from "next/link";

export default function CancelledPage() {
  return <main className="flex min-h-[80vh] items-center justify-center px-5 py-16"><div className="max-w-xl rounded-3xl bg-white p-8 text-center shadow-[0_18px_60px_rgba(32,61,49,0.1)] sm:p-12"><div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-sand text-3xl text-forest">↩</div><p className="eyebrow mt-6">No worries</p><h1 className="mt-2 font-display text-5xl text-forest">Checkout cancelled</h1><p className="mt-5 leading-7 text-ink/65">Nothing was charged. Your dates are available to choose again whenever you are ready.</p><Link href="/" className="mt-8 inline-flex rounded-full bg-forest px-6 py-3 font-semibold text-white">Return to Tourmaline House</Link></div></main>;
}
