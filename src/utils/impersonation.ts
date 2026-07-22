import { setCookie, removeCookie } from "./cookies";

const FLAG = "hr_impersonation";

export interface HrImpersonation {
  lineId: string;
  lineName: string;
  userId: string;
}

/**
 * Enter a line's HR as super-admin. Stores the minted line session exactly like
 * a normal login, plus a flag for the banner, then hard-navigates into the HR
 * module so the line shell (`ProtectedRoute`) hydrates the new session cleanly.
 * The separate super-admin session (`auth_admin`) is left untouched.
 *
 * The session is keyed on the USER id, matching Login.tsx — the auth provider
 * reads `localStorage.user` and exposes it as `auth.userId`, which every HR
 * screen sends as `userId` on writes. Those land in audit rows whose `userId`
 * is a foreign key to User, so keying this on the ACCOUNT id (as it first did)
 * made every save fail with a 500.
 */
export const enterLineHr = (session: {
  token: string;
  userId: string;
  lineId: string;
  lineName: string;
}) => {
  setCookie(`auth_token-${session.userId}`, session.token, 8);
  localStorage.setItem("user", session.userId);
  // Keep the root-page redirect pointed at the line being managed — a stale
  // "line" from a previous normal login would bounce "/" to the wrong line.
  localStorage.setItem("line", session.lineId);
  localStorage.setItem(
    FLAG,
    JSON.stringify({
      lineId: session.lineId,
      lineName: session.lineName,
      userId: session.userId,
    } satisfies HrImpersonation),
  );
  window.location.href = `/${session.lineId}/human-resources/dashboard`;
};

export const getHrImpersonation = (): HrImpersonation | null => {
  try {
    const raw = localStorage.getItem(FLAG);
    return raw ? (JSON.parse(raw) as HrImpersonation) : null;
  } catch {
    return null;
  }
};

/** Exit impersonation: clear the line session + flag, return to the admin panel. */
export const exitLineHr = () => {
  const imp = getHrImpersonation();
  if (imp?.userId) removeCookie(`auth_token-${imp.userId}`);
  localStorage.removeItem("user");
  localStorage.removeItem("line");
  localStorage.removeItem(FLAG);
  window.location.href = "/admin-panel";
};
