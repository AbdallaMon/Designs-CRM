"use client";

// Minimal provider stack for the PUBLIC client-chat surface. The shared ChatWindow (and
// its hooks) call useAuth()/usePermission(), which throw without an AuthContext. The real
// v2 AuthProvider would call GET auth/me and redirect to /login on the 401 a client always
// gets — wrong for a token-authed public page. So we supply a STATIC guest AuthContext:
// no user id, EMPTY permissions ⇒ every permission gate denies (no member management, no
// admin, no read-receipt POST). The client identity travels separately via clientContext,
// not via this context. We also mount the v2 SocketProvider keyed by clientId.

import { AuthContext } from "@/app/v2/providers/AuthProvider";
import { SocketProvider } from "@/app/v2/providers/SocketProvider";

const GUEST_AUTH = {
  // guest shape: no id, no permissions ⇒ usePermission() returns all-false.
  user: { role: null, permissions: [], permissionsByModule: {} },
  isLoggedIn: false,
  validatingAuth: false,
  setAuthUser: () => {},
  logout: () => {},
};

export function ClientChatProviders({ clientId, children }) {
  return (
    <AuthContext.Provider value={GUEST_AUTH}>
      <SocketProvider clientId={clientId}>{children}</SocketProvider>
    </AuthContext.Provider>
  );
}

export default ClientChatProviders;
