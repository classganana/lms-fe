const DEFAULT_API_BASE_URL = "http://18.61.48.70:3000";

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? DEFAULT_API_BASE_URL;

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

