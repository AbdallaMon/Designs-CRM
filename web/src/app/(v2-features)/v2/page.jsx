import { redirect } from "next/navigation";

// /v2 landing. The pre-redesign app had no unified /v2 index (each feature is its own
// route); send the bare /v2 to the dashboard. Unauthenticated users fall through the v2
// AuthProvider's session check to /login.
export default function Page() {
  redirect("/v2/dashboard");
}
