import Link from "next/link";
import { notFound } from "next/navigation";

import { getTemplateById } from "@/lib/templates/queries";
import { CATEGORY_ICON, CATEGORY_LABELS } from "@/lib/templates/types";

import { TemplateEditForm } from "./template-edit-form";

export const dynamic = "force-dynamic";

export default async function TemplateDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const template = await getTemplateById(id).catch(() => null);
  if (!template) notFound();

  return (
    <main className="mx-auto flex max-w-[1400px] flex-col gap-8 px-8 py-12">
      <div>
        <Link
          href="/templates"
          className="text-wfc-grey hover:text-wfc-blue-deep text-xs tracking-widest uppercase"
        >
          ← Templates
        </Link>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span className="text-2xl" aria-hidden>
            {CATEGORY_ICON[template.category]}
          </span>
          <span className="font-headline text-wfc-grey text-[10px] tracking-[0.18em] uppercase">
            {CATEGORY_LABELS[template.category]}
          </span>
        </div>
        <h1 className="font-display text-wfc-blue-deep mt-1 text-4xl uppercase">
          {template.title}
        </h1>
      </div>
      <TemplateEditForm template={template} />
    </main>
  );
}
