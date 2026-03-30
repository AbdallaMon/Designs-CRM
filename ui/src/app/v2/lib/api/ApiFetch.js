import config from "../config";

class ApiFetch {
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
    this._refreshPromise = null;
    this.onAuthFailure = null;
  }

  _buildUrl(path) {
    return `${this.baseUrl}/${path.replace(/^\//, "")}`;
  }

  _buildHeaders(isFileUpload, customHeader) {
    if (customHeader) return { "Content-Type": customHeader };
    if (isFileUpload) return {};
    return { "Content-Type": "application/json" };
  }

  _serializeBody(body, isFileUpload) {
    if (body === undefined || body === null) return undefined;
    return isFileUpload ? body : JSON.stringify(body);
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
    } = opts;

    const headers = this._buildHeaders(isFileUpload, customHeader);

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
    } catch {
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

    return result;
  }

  async get(path) {
    return this._request(path, { method: "GET" });
  }

  async getPaginated(url, params) {
    const path = this._buildPaginatedPath(url, params);
    return this._request(path, { method: "GET" });
  }

  async submit(method, path, body, isFileUpload = false, customHeader) {
    return this._request(path, {
      method: method.toUpperCase(),
      body: this._serializeBody(body, isFileUpload),
      isFileUpload,
      customHeader,
    });
  }

  async post(path, body, isFileUpload = false, customHeader) {
    return this.submit("POST", path, body, isFileUpload, customHeader);
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
}

const apiFetch = new ApiFetch(config.apiUrl);
const legacyApiFetch = new ApiFetch(config.legacyApiUrl);
export default apiFetch;
export { legacyApiFetch };
