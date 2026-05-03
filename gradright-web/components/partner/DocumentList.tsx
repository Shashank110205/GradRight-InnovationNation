import type { SignedDocumentItem } from "@/lib/nbfc/sign-loan-docs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function DocumentList({ documents }: { documents: SignedDocumentItem[] }) {
  if (!documents.length) {
    return (
      <Card className="border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/50">
        <CardHeader>
          <CardTitle className="text-base">Documents</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-slate-600 dark:text-slate-400">
          No documents uploaded yet.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/50">
      <CardHeader>
        <CardTitle className="text-base">Documents</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {documents.map((d) => (
          <div
            key={`${d.storage_path}-${d.uploaded_at}`}
            className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 px-3 py-2 dark:border-slate-700"
          >
            <div>
              <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                {d.file_name}
              </p>
              <p className="text-xs capitalize text-slate-500 dark:text-slate-400">
                {d.document_type.replace(/_/g, " ")} · OCR: {d.ocr_status}
              </p>
            </div>
            {d.signed_url ? (
              <a
                href={d.signed_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium text-slate-900 underline-offset-4 hover:underline dark:text-slate-100"
              >
                Download
              </a>
            ) : (
              <span className="text-xs text-amber-700 dark:text-amber-300">
                Link unavailable (check storage config)
              </span>
            )}
          </div>
        ))}
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Signed URLs expire in about one hour.
        </p>
      </CardContent>
    </Card>
  );
}
