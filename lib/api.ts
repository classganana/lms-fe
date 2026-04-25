/**
 * Baked in at `next build` from `NEXT_PUBLIC_API_BASE_URL` (set in .env or Docker --build-arg).
 * Never commit a public EC2 IP here — use HTTPS in production to avoid mixed-content blocks.
 */
function resolveApiBaseUrl(): string {
  const raw = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (typeof raw === "string" && raw.trim() !== "") {
    return raw.replace(/\/$/, "");
  }
  if (process.env.NODE_ENV === "development") {
    return "http://localhost:3000";
  }
  // Production: same-origin (e.g. nginx proxies /auth, /sales, /admin) or set NEXT_PUBLIC at build
  return "";
}

export const API_BASE_URL = resolveApiBaseUrl();

/** Parse NestJS/class-validator error response into a user-friendly message */
export async function parseApiError(response: Response): Promise<string> {
  try {
    const body = await response.json();
    const msg = body?.message;
    if (Array.isArray(msg)) return msg.join('. ');
    if (typeof msg === 'string') return msg;
    return `Request failed (${response.status})`;
  } catch {
    return `Request failed (${response.status})`;
  }
}

