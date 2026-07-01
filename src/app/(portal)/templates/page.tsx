import Link from "next/link";

import { listTemplates } from "@/lib/templates/queries";
import { CATEGORY_ICON, CATEGORY_LABELS } from "@/lib/templates/types";

export const dynamic = "force-dynamic";

export default async function TemplatesPage() {
  const templates = await listTemplates().catch(() => []);

  return (
    <main className="mx-auto flex max-w-[1400px] flex-col gap-8 px-8 py-12">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-headline text-wfc-red text-xs tracking-[0.3em] uppercase">
            Communications
          </p>
          <h1 className="font-display text-wfc-blue-deep text-5xl leading-none uppercase">
            Templates
          </h1>
          <p className="text-wfc-charcoal mt-2 max-w-2xl font-serif text-base">
            Reusable content for social posts, admin letters, and landing-page takeovers. Every
            template is fully editable — pick one and adapt the text each time you deploy.
          </p>
        </div>
        <Link
          href="/templates/new"
          className="bg-wfc-red hover:bg-wfc-red-deep flex items-center gap-2 rounded-md px-5 py-3 text-sm font-semibold text-white transition"
        >
          + New template
        </Link>
      </header>

      {templates.length === 0 ? (
        <div className="border-wfc-line rounded-lg border border-dashed p-12 text-center">
          <p className="text-wfc-charcoal font-serif text-lg">No templates yet.</p>
          <p className="text-wfc-grey mt-2 text-sm">
            Create the club&apos;s first reusable post, letter, or takeover announcement.
          </p>
          <Link
            href="/templates/new"
            className="bg-wfc-red mt-4 inline-block rounded-md px-5 py-2 text-sm font-semibold text-white"
          >
            + New template
          </Link>
        </div>
      ) : (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {templates.map((template) => (
            <li key={template.id}>
              <Link
                href={`/templates/${template.id}`}
                className="border-wfc-line hover:border-wfc-red block h-full rounded-lg border bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)] transition"
              >
                <div className="mb-3 flex items-center gap-2">
                  <span className="text-2xl" aria-hidden>
                    {CATEGORY_ICON[template.category]}
                  </span>
                  <span className="font-headline text-wfc-grey text-[10px] tracking-[0.18em] uppercase">
                    {CATEGORY_LABELS[template.category]}
                  </span>
                </div>
                <h2 className="text-wfc-blue-deep font-serif text-lg leading-snug font-semibold">
                  {template.title}
                </h2>
                <p className="text-wfc-grey mt-3 text-xs">
                  Updated {new Date(template.updatedAt).toLocaleDateString("en-AU")}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
