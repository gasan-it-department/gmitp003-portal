import { setCookie, removeCookie } from "./cookies";

const FLAG = "hr_impersonation";

export interface HrImpersonation {
  lineId: string;
  lineName: string;
  accountId: string;
}

/**
 * Enter a line's HR as super-admin. Stores the minted line session exactly like
 * a normal login (cookie `auth_token-<accountId>` + localStorage `user`), plus
 * a flag for the banner, then hard-navigates into the HR module so the line
 * shell (`ProtectedRoute`) hydrates the new session cleanly. The separate
 * super-admin session (`auth_admin`) is left untouched.
 */
export const enterLineHr = (session: {
  token: string;
  accountId: string;
  lineId: string;
  lineName: string;
}) => {
  setCookie(`auth_token-${session.accountId}`, session.token, 8);
  localStorage.setItem("user", session.accountId);
  localStorage.setItem(
    FLAG,
    JSON.stringify({
      lineId: session.lineId,
      lineName: session.lineName,
      accountId: session.accountId,
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
  if (imp?.accountId) removeCookie(`auth_token-${imp.accountId}`);
  localStorage.removeItem("user");
  localStorage.removeItem(FLAG);
  window.location.href = "/admin-panel";
};
