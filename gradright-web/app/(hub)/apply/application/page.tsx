import { redirect } from "next/navigation";

/** Legacy bookmark: canonical flow is `/apply`. */
export default function ApplyApplicationAliasPage() {
  redirect("/apply");
}
