import Link from "next/link";

import { TemplateForm } from "./template-form";

export const metadata = { title: "New template" };

export default function NewTemplatePage() {
  return (
    <main className="mx-auto flex max-w-[1400px] flex-col gap-8 px-8 py-12">
      <div>
        <Link
          href="/templates"
          className="text-wfc-grey hover:text-wfc-blue-deep text-xs tracking-widest uppercase"
        >
          ← Templates
        </Link>
        <h1 className="font-display text-wfc-blue-deep mt-2 text-4xl uppercase">New template</h1>
      </div>
      <TemplateForm />
    </main>
  );
}
