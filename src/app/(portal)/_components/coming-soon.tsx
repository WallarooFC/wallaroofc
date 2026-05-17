export function ComingSoon({ title, step }: { title: string; step: string }) {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="font-serif text-3xl font-semibold tracking-[-0.01em] text-wfc-blue-deep">
        {title}
      </h1>
      <p className="max-w-2xl text-sm text-wfc-grey">
        Lands in <span className="font-mono text-wfc-blue-deep">{step}</span> of the build
        plan. The schema and seed for this surface are already in place — the UI is the
        outstanding piece.
      </p>
    </div>
  );
}
