import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { FileText } from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { fetchDocuments, resolveFileUrl, type StoreDocument } from "@/lib/store";

export const Route = createFileRoute("/catalogue")({
  head: () => ({
    meta: [
      { title: "Catalogue & Guides (PDF) | Intellectual Mindset Clothing" },
      {
        name: "description",
        content:
          "Download the Intellectual Mindset Clothing catalogue, price lists and size guides as PDF documents.",
      },
      { property: "og:title", content: "Catalogue & guides | Intellectual Mindset Clothing" },
      {
        property: "og:description",
        content: "Catalogues, price lists and size guides you can read or download.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Catalogue,
});

function DocumentRow({ doc }: { doc: StoreDocument }) {
  async function open() {
    const url = await resolveFileUrl("documents", doc.file_url);
    if (url) window.open(url, "_blank", "noopener,noreferrer");
  }

  return (
    <li className="flex items-center justify-between gap-4 border border-border p-5">
      <div className="flex items-start gap-4">
        <FileText className="mt-1 size-6 shrink-0 text-lime" />
        <div>
          <h2 className="text-xl uppercase">{doc.title}</h2>
          {doc.description ? (
            <p className="mt-1 text-sm text-muted-foreground">{doc.description}</p>
          ) : null}
        </div>
      </div>
      <button type="button" onClick={open} className="label-tag bg-ink px-4 py-2 text-ink-foreground">
        Read
      </button>
    </li>
  );
}

function Catalogue() {
  const { data: docs, isPending } = useQuery({
    queryKey: ["documents", "visible"],
    queryFn: () => fetchDocuments(true),
  });

  return (
    <SiteLayout>
      <div className="border-b border-border bg-card">
        <div className="mx-auto max-w-7xl px-4 py-10">
          <h1 className="text-4xl uppercase sm:text-5xl">Catalogue & guides</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Read or download our catalogues, price lists and size guides.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 py-12">
        <ul className="space-y-4">
          {(docs ?? []).map((doc) => (
            <DocumentRow key={doc.id} doc={doc} />
          ))}
        </ul>
        {!isPending && (docs ?? []).length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            No documents published yet.
          </p>
        ) : null}
      </div>
    </SiteLayout>
  );
}
