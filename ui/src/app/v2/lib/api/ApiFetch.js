import config from "../config";
export function logToMd(...args) {
  const time = new Date().toISOString();

  const text = args
    .map((item) => {
      if (typeof item === "string") return item;
      try {
        return JSON.stringify(item, null, 2);
      } catch {
        return String(item);
      }
    })
    .join(" ");

  const entry = `## ${time}

\`\`\`txt
${text}
\`\`\`

`;

  // normal browser console
  console.log(...args);

  // save all logs in one markdown string
  if (typeof window !== "undefined") {
    const prev = localStorage.getItem("debug-log-md") || "";
    localStorage.setItem("debug-log-md", prev + entry);
  }
}

export function clearMdLogs() {
  if (typeof window !== "undefined") {
    localStorage.removeItem("debug-log-md");
  }
}
class ApiFetch {
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
    this._refreshPromise = null;
    this.onAuthFailure = null;
  }

  _buildUrl(path) {
    return `${this.baseUrl}/${path.replace(/^\//, "")}`;
  }

  _buildHeaders(isFileUpload, customHeader, isMultipart) {
    if (customHeader) return { "Content-Type": customHeader };
    if (isFileUpload || isMultipart) return {};

    return { "Content-Type": "application/json" };
  }

  _serializeBody(body, isFileUpload, isMultipart) {
    if (body === undefined || body === null) return undefined;
    return isFileUpload || isMultipart ? body : JSON.stringify(body);
  }

  _buildPaginatedPath(url, { page, limit, filters, search, sort, others }) {
    let queryPrefix = "?";
    if (url.endsWith("&")) {
      queryPrefix = "";
    } else if (url.includes("?")) {
      queryPrefix = "&";
    }
    return (
      `${url}${queryPrefix}` +
      `page=${page}&limit=${limit}` +
      `&filters=${JSON.stringify(filters)}` +
      `&search=${search}` +
      `&sort=${JSON.stringify(sort)}` +
      `&${others}`
    );
  }

  async _refreshToken() {
    if (this._refreshPromise) {
      return this._refreshPromise;
    }

    this._refreshPromise = this._request("auth/refresh", {
      method: "POST",
      _skipRefresh: true, // prevent infinite refresh loop
    })
      .then((result) => result.status === 200)
      .catch(() => false)
      .finally(() => {
        this._refreshPromise = null;
      });

    return this._refreshPromise;
  }

  async _request(path, opts = {}) {
    const {
      method = "GET",
      body,
      isFileUpload = false,
      customHeader,
      _skipRefresh = false,
      isMultipart = false,
    } = opts;

    const headers = this._buildHeaders(isFileUpload, customHeader, isMultipart);

    const response = await fetch(this._buildUrl(path), {
      method,
      body,
      headers,
      credentials: "include",
    });

    const status = response.status;

    let result;
    try {
      result = await response.json();
    } catch (e) {
      console.warn("Failed to parse JSON response:", e);
      result = { message: response.statusText };
    }
    result.status = status;
    if (status === 401 && !_skipRefresh) {
      const refreshed = await this._refreshToken();
      if (refreshed) {
        return this._request(path, opts);
      }

      if (this.onAuthFailure) {
        this.onAuthFailure();
      }
    }
    // ─────────────────────────────────────────────────────────────────────────

    if (status >= 400) {
      const error = new Error(
        result.message || response.statusText || "Request failed",
      );
      error.status = status;
      error.data = result;
      throw error;
    }

    return result;
  }

  async get(path) {
    return this._request(path, { method: "GET" });
  }

  async getPaginated(url, params) {
    const path = this._buildPaginatedPath(url, params);
    return this._request(path, { method: "GET" });
  }

  async submit(
    method,
    path,
    body,
    isFileUpload = false,
    customHeader,
    isMultipart = false,
  ) {
    return this._request(path, {
      method: method.toUpperCase(),
      body: this._serializeBody(body, isFileUpload, isMultipart),
      isFileUpload,
      customHeader,
      isMultipart,
    });
  }

  async post(
    path,
    body,
    isFileUpload = false,
    customHeader,
    isMultipart = false,
  ) {
    return this.submit(
      "POST",
      path,
      body,
      isFileUpload,
      customHeader,
      isMultipart,
    );
  }

  async put(path, body, isFileUpload = false, customHeader) {
    return this.submit("PUT", path, body, isFileUpload, customHeader);
  }

  async patch(path, body, isFileUpload = false, customHeader) {
    return this.submit("PATCH", path, body, isFileUpload, customHeader);
  }

  async delete(path) {
    return this._request(path, { method: "DELETE" });
  }
  get public() {
    const self = this;
    return {
      get: (path) => self._request(path, { method: "GET", _skipRefresh: true }),
      post: (path, body) =>
        self._request(path, {
          method: "POST",
          body: self._serializeBody(body),
          _skipRefresh: true,
        }),
      put: (path, body) =>
        self._request(path, {
          method: "PUT",
          body: self._serializeBody(body),
          _skipRefresh: true,
        }),
      patch: (path, body) =>
        self._request(path, {
          method: "PATCH",
          body: self._serializeBody(body),
          _skipRefresh: true,
        }),
      delete: (path) =>
        self._request(path, { method: "DELETE", _skipRefresh: true }),
    };
  }
}

const apiFetch = new ApiFetch(config.apiUrl);
const legacyApiFetch = new ApiFetch(config.legacyApiUrl);
export default apiFetch;
export { legacyApiFetch };
