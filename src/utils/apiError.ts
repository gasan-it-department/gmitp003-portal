/**
 * Turn a failed request into something a person can act on.
 *
 * The usual one-liner — `e?.response?.data?.message || e?.message` — is right
 * when the API answered, because the API always puts a real reason in the
 * body. It falls apart when the API did NOT answer: a gateway timeout, a
 * restarting container, a proxy error page. Those come back with an HTML body
 * and no `message`, so the fallback becomes axios's own string and the reader
 * is told "Request failed with status code 500" — which names neither what
 * failed nor the fact that the server was never reached.
 *
 * This separates the three cases, because the response to each is different:
 * a server reason is something to correct, a timeout is something to retry
 * with fewer rows, and no response at all is the connection.
 */
export const describeApiError = (
  err: unknown,
  fallback = "Something went wrong",
): string => {
  const e = err as {
    code?: string;
    message?: string;
    response?: { status?: number; data?: unknown };
  };

  // 1. No response: the request never completed.
  if (!e?.response) {
    if (e?.code === "ECONNABORTED")
      return "The request timed out before the server answered. It may still be running — reload before trying again.";
    return "Could not reach the server. Check your connection and try again.";
  }

  const status = e.response.status ?? 0;
  const data = e.response.data as
    | { message?: unknown; error?: unknown }
    | string
    | undefined;

  // 2. The API answered in its own format — that message is the useful one.
  if (data && typeof data === "object") {
    const m = (data as { message?: unknown }).message;
    if (typeof m === "string" && m.trim()) return m;
    const alt = (data as { error?: unknown }).error;
    if (typeof alt === "string" && alt.trim() && alt !== "InternalServerError")
      return alt;
  }

  // 3. A response that is not ours — almost always the platform in front of
  //    it. Say which, so it is not mistaken for an application bug.
  if (status === 502 || status === 503 || status === 504) {
    return `The server did not answer in time (${status}). If you were sending, some messages may already have gone out — reload and check before sending again.`;
  }
  if (typeof data === "string" && /<html/i.test(data)) {
    return `The server returned an error page (${status}) instead of a result. Reload and check what actually happened before retrying.`;
  }
  if (status >= 500) {
    return `The server failed on this request (${status}). ${fallback}`;
  }

  return fallback;
};
