import { afterEach, describe, expect, it, vi } from "vitest";

const jsonResponse = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

async function loadApiClient(fetchMock) {
  vi.resetModules();
  vi.stubEnv("NEXT_PUBLIC_API", "https://api.example.com");
  vi.stubGlobal("document", { cookie: "" });
  vi.stubGlobal("fetch", fetchMock);
  return import("../apiClient.js");
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("apiRequest CSRF recovery", () => {
  it("refreshes a stale CSRF token and retries a mutation once", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ data: { csrfToken: "stale-token" } }))
      .mockResolvedValueOnce(
        jsonResponse(
          { code: "FORBIDDEN", reason: "csrf token mismatch" },
          403,
        ),
      )
      .mockResolvedValueOnce(jsonResponse({ data: { csrfToken: "fresh-token" } }))
      .mockResolvedValueOnce(jsonResponse({ success: true }));
    const { apiRequest } = await loadApiClient(fetchMock);

    const response = await apiRequest("projects/1", { method: "PATCH" });

    expect(response.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(4);
    expect(new Headers(fetchMock.mock.calls[1][1].headers).get("x-csrf-token"))
      .toBe("stale-token");
    expect(new Headers(fetchMock.mock.calls[3][1].headers).get("x-csrf-token"))
      .toBe("fresh-token");
  });

  it("fetches a fresh CSRF token before logout instead of sending a cached token", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ data: { csrfToken: "cached-token" } }))
      .mockResolvedValueOnce(jsonResponse({ success: true }))
      .mockResolvedValueOnce(jsonResponse({ data: { csrfToken: "logout-token" } }))
      .mockResolvedValueOnce(jsonResponse({ success: true }));
    const { apiRequest } = await loadApiClient(fetchMock);

    await apiRequest("projects/1", { method: "PATCH" });
    const response = await apiRequest("auth/logout", { method: "POST" });

    expect(response.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(4);
    expect(fetchMock.mock.calls[2][0]).toBe("https://api.example.com/v2/auth/csrf");
    expect(new Headers(fetchMock.mock.calls[3][1].headers).get("x-csrf-token"))
      .toBe("logout-token");
  });

  it("does not retry an origin denial as a token mismatch", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ data: { csrfToken: "token" } }))
      .mockResolvedValueOnce(
        jsonResponse(
          { code: "FORBIDDEN", reason: "untrusted request origin" },
          403,
        ),
      );
    const { apiRequest } = await loadApiClient(fetchMock);

    const response = await apiRequest("projects/1", { method: "PATCH" });

    expect(response.status).toBe(403);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
