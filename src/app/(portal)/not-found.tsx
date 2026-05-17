import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-xl flex-col gap-4 py-16 text-center">
      <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-wfc-grey">
        404 · not found
      </p>
      <h1 className="font-serif text-3xl font-semibold text-wfc-blue-deep">
        Nothing here.
      </h1>
      <p className="text-sm text-wfc-grey">
        The page you were looking for has either moved or never existed in this build.
      </p>
      <div>
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-md bg-wfc-red px-4 py-2 font-mono text-xs uppercase tracking-[0.14em] text-wfc-cream hover:bg-wfc-red-deep"
        >
          Back to dashboard
        </Link>
      </div>
    </div>
  );
}
