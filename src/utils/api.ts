/**
 * Safe fetch helper that guarantees no uncaught JSON parse errors
 * (e.g., "Unexpected token '<', <!doctype ... is not valid JSON")
 */
export async function safeFetchJson<T = any>(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<{ ok: boolean; status: number; data?: T; error?: string }> {
  try {
    const res = await fetch(input, init);
    const contentType = res.headers.get("content-type") || "";
    let data: any = null;

    try {
      if (contentType.includes("application/json")) {
        data = await res.json();
      } else {
        const text = await res.text();
        data = text ? JSON.parse(text) : null;
      }
    } catch {
      data = null;
    }

    if (!res.ok) {
      const errorMsg =
        data?.error ||
        data?.message ||
        (res.status === 404
          ? "Endpoint not found."
          : res.status === 502
          ? "Service temporarily unavailable. Please try again."
          : `Request failed (status ${res.status})`);
      return { ok: false, status: res.status, error: errorMsg, data };
    }

    return { ok: true, status: res.status, data };
  } catch (err: any) {
    return {
      ok: false,
      status: 0,
      error: err?.message || "Network request failed. Please check your connection.",
    };
  }
}
