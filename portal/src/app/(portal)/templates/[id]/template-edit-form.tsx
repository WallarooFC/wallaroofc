"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { deleteTemplate, updateTemplate } from "@/lib/templates/actions";
import { type Template, type TemplateBody } from "@/lib/templates/types";
import { cn } from "@/lib/utils";

export function TemplateEditForm({ template }: { template: Template }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [deleting, startDeleting] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const [title, setTitle] = useState(template.title);
  const [body, setBody] = useState<TemplateBody>(template.body);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSaved(false);
    startTransition(async () => {
      const result = await updateTemplate({
        id: template.id,
        patch: { title, body, category: template.category },
      });
      if (result && "error" in result && result.error) {
        setError(result.error);
        return;
      }
      setSaved(true);
      router.refresh();
    });
  }

  function handleDelete() {
    if (!confirm("Delete this template? This can't be undone.")) return;
    startDeleting(async () => {
      const result = await deleteTemplate(template.id);
      if (result && "error" in result && result.error) {
        setError(result.error);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex max-w-2xl flex-col gap-6">
      <label className="flex flex-col gap-2">
        <span className="font-headline text-wfc-grey text-[11px] tracking-[0.12em] uppercase">
          Title
        </span>
        <input
          type="text"
          required
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          className="border-wfc-line focus:border-wfc-blue-deep rounded-md border bg-white px-3 py-2.5 text-sm outline-none"
        />
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
      {saved ? (
        <p
          role="status"
          className="border-wfc-status-green/30 bg-wfc-status-green/8 text-wfc-status-green rounded-md border px-3 py-2 text-xs"
        >
          Saved.
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className={cn(
            "bg-wfc-red rounded-md px-5 py-2.5 text-sm font-semibold text-white transition",
            "hover:bg-wfc-red-deep disabled:cursor-not-allowed disabled:opacity-60",
          )}
        >
          {pending ? "Saving…" : "Save changes"}
        </button>
        <button
          type="button"
          onClick={handleDelete}
          disabled={deleting}
          className="text-wfc-status-red text-sm hover:underline disabled:opacity-60"
        >
          {deleting ? "Deleting…" : "Delete template"}
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
            Hashtags
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
            Letter body (Markdown)
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
              Signer
            </span>
            <input
              type="text"
              value={body.signerName ?? ""}
              onChange={(event) => onChange({ ...body, signerName: event.target.value })}
              className="border-wfc-line focus:border-wfc-blue-deep rounded-md border bg-white px-3 py-2.5 text-sm outline-none"
            />
          </label>
          <label className="flex flex-col gap-2">
            <span className="font-headline text-wfc-grey text-[11px] tracking-[0.12em] uppercase">
              Role
            </span>
            <input
              type="text"
              value={body.signerRole ?? ""}
              onChange={(event) => onChange({ ...body, signerRole: event.target.value })}
              className="border-wfc-line focus:border-wfc-blue-deep rounded-md border bg-white px-3 py-2.5 text-sm outline-none"
            />
          </label>
        </div>
      </>
    );
  }

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
            CTA label
          </span>
          <input
            type="text"
            value={body.ctaLabel ?? ""}
            onChange={(event) => onChange({ ...body, ctaLabel: event.target.value || null })}
            className="border-wfc-line focus:border-wfc-blue-deep rounded-md border bg-white px-3 py-2.5 text-sm outline-none"
          />
        </label>
        <label className="flex flex-col gap-2">
          <span className="font-headline text-wfc-grey text-[11px] tracking-[0.12em] uppercase">
            CTA URL
          </span>
          <input
            type="url"
            value={body.ctaUrl ?? ""}
            onChange={(event) => onChange({ ...body, ctaUrl: event.target.value || null })}
            className="border-wfc-line focus:border-wfc-blue-deep rounded-md border bg-white px-3 py-2.5 text-sm outline-none"
          />
        </label>
      </div>
    </>
  );
}
