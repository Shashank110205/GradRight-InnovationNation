import { createServiceRoleSupabaseClient } from "@/lib/db/supabase";
import type { DocumentRecord } from "@/lib/types";

const BUCKET = "loan-documents";
const EXPIRY_SEC = 3600;

export type SignedDocumentItem = DocumentRecord & {
  signed_url: string | null;
};

export async function signLoanDocuments(
  documents: DocumentRecord[]
): Promise<SignedDocumentItem[]> {
  let admin: ReturnType<typeof createServiceRoleSupabaseClient> | null = null;
  try {
    admin = createServiceRoleSupabaseClient();
  } catch {
    return documents.map((d) => ({ ...d, signed_url: null }));
  }

  const out: SignedDocumentItem[] = [];
  for (const d of documents) {
    const { data, error } = await admin.storage
      .from(BUCKET)
      .createSignedUrl(d.storage_path, EXPIRY_SEC);
    out.push({
      ...d,
      signed_url: error ? null : data?.signedUrl ?? null,
    });
  }
  return out;
}
