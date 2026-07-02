"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";

import { createTemplate } from "@/lib/templates/actions";
import {
  CATEGORY_LABELS,
  TEMPLATE_CATEGORIES,
  expectedBodyKind,
  type CreateTemplateInput,
  type TemplateBody,
  type TemplateCategory,
} from "@/lib/templates/types";
import { cn } from "@/lib/utils";

const emptyBodyFor: Record<TemplateBody["kind"], TemplateBody> = {
  social: { kind: "social", text: "", hashtags: [] },
  letter: { kind: "letter", markdown: "", recipientName: "", signerName: "", signerRole: "" },
  takeover: { kind: "takeover", heading: "", body: "", ctaLabel: null, ctaUrl: null },
};

export function TemplateForm() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<TemplateCategory>("social_facebook");
  const bodyKind = useMemo(() => expectedBodyKind(category), [category]);
  const [body, setBody] = useState<TemplateBody>(emptyBodyFor[bodyKind]);

  function handleCategoryChange(next: TemplateCategory) {
    setCategory(next);
    const nextKind = expectedBodyKind(next);
    if (nextKind !== body.kind) {
      setBody(emptyBodyFor[nextKind]);
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const payload: CreateTemplateInput = {
      title,
      category,
      body,
      imagePath: null,
    };
    startTransition(async () => {
      const result = await createTemplate(payload);
      if ("error" in result && result.error) {
        setError(result.error);
        return;
      }
      if ("id" in result) {
        router.push(`/templates/${result.id}`);
        router.refresh();
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex max-w-2xl flex-col gap-6">
      <label className="flex flex-col gap-2">
        <span className="font-headline text-wfc-grey text-[11px] tracking-[0.12em] uppercase">
          Template title
        </span>
        <input
          type="text"
          required
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="e.g. Home game reminder"
          className="border-wfc-line focus:border-wfc-blue-deep rounded-md border bg-white px-3 py-2.5 text-sm outline-none"
        />
      </label>

      <label className="flex flex-col gap-2">
        <span className="font-headline text-wfc-grey text-[11px] tracking-[0.12em] uppercase">
          Category
        </span>
        <select
          value={category}
          onChange={(event) => handleCategoryChange(event.target.value as TemplateCategory)}
          className="border-wfc-line focus:border-wfc-blue-deep rounded-md border bg-white px-3 py-2.5 text-sm outline-none"
        >
          {TEMPLATE_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {CATEGORY_LABELS[c]}
            </option>
          ))}
        </select>
      </label>

      <BodyFields body={body} onChange={setBody} />

      {error ? (
        <p
          role="alert"
          className="border-wfc-status-red/30 bg-wfc-status-red/8 text-wfc-status-red rounded-md border px-3 py-2 text-xs"
        >
          {error}
        </p>
      ) : null}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className={cn(
            "bg-wfc-red rounded-md px-5 py-2.5 text-sm font-semibold text-white transition",
            "hover:bg-wfc-red-deep disabled:cursor-not-allowed disabled:opacity-60",
          )}
        >
          {pending ? "Saving…" : "Create template"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/templates")}
          className="text-wfc-grey hover:text-wfc-blue-deep px-3 text-sm"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

function BodyFields({
  body,
  onChange,
}: {
  body: TemplateBody;
  onChange: (next: TemplateBody) => void;
}) {
  if (body.kind === "social") {
    return (
      <>
        <label className="flex flex-col gap-2">
          <span className="font-headline text-wfc-grey text-[11px] tracking-[0.12em] uppercase">
            Post text
          </span>
          <textarea
            required
            rows={6}
            value={body.text}
            onChange={(event) => onChange({ ...body, text: event.target.value })}
            className="border-wfc-line focus:border-wfc-blue-deep rounded-md border bg-white px-3 py-2.5 text-sm outline-none"
          />
        </label>
        <label className="flex flex-col gap-2">
          <span className="font-headline text-wfc-grey text-[11px] tracking-[0.12em] uppercase">
            Hashtags <span className="tracking-normal normal-case">(space or comma separated)</span>
          </span>
          <input
            type="text"
            value={body.hashtags.join(" ")}
            onChange={(event) =>
              onChange({
                ...body,
                hashtags: event.target.value
                  .split(/[\s,]+/)
                  .map((tag) => tag.trim())
                  .filter(Boolean),
              })
            }
            placeholder="#WallarooFC #CopperCoast"
            className="border-wfc-line focus:border-wfc-blue-deep rounded-md border bg-white px-3 py-2.5 text-sm outline-none"
          />
        </label>
      </>
    );
  }

  if (body.kind === "letter") {
    return (
      <>
        <label className="flex flex-col gap-2">
          <span className="font-headline text-wfc-grey text-[11px] tracking-[0.12em] uppercase">
            Letter body (Markdown supported)
          </span>
          <textarea
            required
            rows={12}
            value={body.markdown}
            onChange={(event) => onChange({ ...body, markdown: event.target.value })}
            className="border-wfc-line focus:border-wfc-blue-deep rounded-md border bg-white px-3 py-2.5 font-mono text-sm outline-none"
          />
        </label>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-2">
            <span className="font-headline text-wfc-grey text-[11px] tracking-[0.12em] uppercase">
              Default signer
            </span>
            <input
              type="text"
              value={body.signerName ?? ""}
              onChange={(event) => onChange({ ...body, signerName: event.target.value })}
              placeholder="Jason Niotis"
              className="border-wfc-line focus:border-wfc-blue-deep rounded-md border bg-white px-3 py-2.5 text-sm outline-none"
            />
          </label>
          <label className="flex flex-col gap-2">
            <span className="font-headline text-wfc-grey text-[11px] tracking-[0.12em] uppercase">
              Signer role
            </span>
            <input
              type="text"
              value={body.signerRole ?? ""}
              onChange={(event) => onChange({ ...body, signerRole: event.target.value })}
              placeholder="President"
              className="border-wfc-line focus:border-wfc-blue-deep rounded-md border bg-white px-3 py-2.5 text-sm outline-none"
            />
          </label>
        </div>
      </>
    );
  }

  // takeover
  return (
    <>
      <label className="flex flex-col gap-2">
        <span className="font-headline text-wfc-grey text-[11px] tracking-[0.12em] uppercase">
          Heading
        </span>
        <input
          type="text"
          required
          value={body.heading}
          onChange={(event) => onChange({ ...body, heading: event.target.value })}
          placeholder="Home Round · This Saturday"
          className="border-wfc-line focus:border-wfc-blue-deep rounded-md border bg-white px-3 py-2.5 text-sm outline-none"
        />
      </label>
      <label className="flex flex-col gap-2">
        <span className="font-headline text-wfc-grey text-[11px] tracking-[0.12em] uppercase">
          Body
        </span>
        <textarea
          required
          rows={4}
          value={body.body}
          onChange={(event) => onChange({ ...body, body: event.target.value })}
          className="border-wfc-line focus:border-wfc-blue-deep rounded-md border bg-white px-3 py-2.5 text-sm outline-none"
        />
      </label>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-2">
          <span className="font-headline text-wfc-grey text-[11px] tracking-[0.12em] uppercase">
            CTA label (optional)
          </span>
          <input
            type="text"
            value={body.ctaLabel ?? ""}
            onChange={(event) => onChange({ ...body, ctaLabel: event.target.value || null })}
            placeholder="Buy season pass"
            className="border-wfc-line focus:border-wfc-blue-deep rounded-md border bg-white px-3 py-2.5 text-sm outline-none"
          />
        </label>
        <label className="flex flex-col gap-2">
          <span className="font-headline text-wfc-grey text-[11px] tracking-[0.12em] uppercase">
            CTA URL (optional)
          </span>
          <input
            type="url"
            value={body.ctaUrl ?? ""}
            onChange={(event) => onChange({ ...body, ctaUrl: event.target.value || null })}
            placeholder="https://wallaroofc.com/tickets"
            className="border-wfc-line focus:border-wfc-blue-deep rounded-md border bg-white px-3 py-2.5 text-sm outline-none"
          />
        </label>
      </div>
    </>
  );
}
