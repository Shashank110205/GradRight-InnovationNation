import { redirect } from "next/navigation";

/** Legacy URL; middleware also sends `/nbfc/login` → `/sign-in`. */
export default function LegacyNbfcLoginPage() {
  redirect("/sign-in");
}
