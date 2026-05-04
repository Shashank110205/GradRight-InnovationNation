import { redirect } from "next/navigation";

/** Canonical funding hub — keep `/finance` for bookmarks and legacy links. */
export default function FinanceRedirectPage() {
  redirect("/funding");
}
