export default function PortalLoading() {
  return (
    <div className="flex flex-col gap-6" aria-busy="true">
      <div className="h-32 animate-pulse rounded-lg bg-wfc-blue-deep/10" />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {Array.from({ length: 8 }).map((_, idx) => (
          <div
            key={idx}
            className={`h-48 animate-pulse rounded-lg border border-wfc-line bg-white ${
              idx === 0 ? "lg:col-span-7" : idx === 1 ? "lg:col-span-5" : idx === 2 ? "lg:col-span-12" : "lg:col-span-4"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
