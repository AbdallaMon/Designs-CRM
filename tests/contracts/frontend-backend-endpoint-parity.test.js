import fs from "node:fs";
import path from "node:path";
import { parse } from "@babel/parser";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();
const HTTP_HELPERS = new Set([
  "getData",
  "getDataAndSet",
  "useDataFetcher",
  "useRequest",
  "handleRequestSubmit",
  "apiRequest",
  "fetch",
]);

function filesUnder(relativeDir, predicate) {
  const result = [];
  const visit = (directory) => {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const absolute = path.join(directory, entry.name);
      if (entry.isDirectory()) visit(absolute);
      else if (predicate(absolute)) result.push(absolute);
    }
  };
  visit(path.join(ROOT, relativeDir));
  return result;
}

function sourcePath(file) {
  return path.relative(ROOT, file).replaceAll("\\", "/");
}

function parseFile(file) {
  return parse(fs.readFileSync(file, "utf8"), {
    sourceType: "module",
    plugins: ["jsx"],
  });
}

function walk(node, visit, parent = null) {
  if (!node || typeof node !== "object") return;
  visit(node, parent);
  for (const [key, value] of Object.entries(node)) {
    if (["loc", "start", "end"].includes(key)) continue;
    if (Array.isArray(value)) {
      for (const item of value) walk(item, visit, node);
    } else if (value?.type) {
      walk(value, visit, node);
    }
  }
}

function bindingsFor(ast) {
  const bindings = new Map();
  walk(ast, (node) => {
    if (node.type !== "VariableDeclarator" || node.id.type !== "Identifier") return;
    if (!bindings.has(node.id.name)) bindings.set(node.id.name, node.init);
  });
  return bindings;
}

function objectProperty(object, name) {
  if (object?.type !== "ObjectExpression") return null;
  const property = object.properties.find(
    (entry) =>
      entry.type === "ObjectProperty" &&
      ((entry.key.type === "Identifier" && entry.key.name === name) ||
        (entry.key.type === "StringLiteral" && entry.key.value === name)),
  );
  return property?.value ?? null;
}

function expressionVariants(node, bindings, seen = new Set()) {
  if (!node) return [];
  if (node.type === "StringLiteral") return [node.value];
  if (node.type === "NumericLiteral") return [String(node.value)];
  if (node.type === "TemplateLiteral") {
    let variants = [node.quasis[0]?.value?.cooked ?? ""];
    node.expressions.forEach((expression, index) => {
      const values = expressionVariants(expression, bindings, seen);
      const replacements = values.length
        ? values
        : [`:${expression.name || "param"}`];
      variants = variants.flatMap((base) =>
        replacements.map(
          (replacement) =>
            `${base}${replacement}${node.quasis[index + 1]?.value?.cooked ?? ""}`,
        ),
      );
    });
    return variants;
  }
  if (node.type === "BinaryExpression" && node.operator === "+") {
    const left = expressionVariants(node.left, bindings, seen);
    const right = expressionVariants(node.right, bindings, seen);
    if (!left.length || !right.length) return [];
    return left.flatMap((a) => right.map((b) => `${a}${b}`));
  }
  if (node.type === "ConditionalExpression" || node.type === "LogicalExpression") {
    const left = node.type === "ConditionalExpression" ? node.consequent : node.left;
    const right = node.type === "ConditionalExpression" ? node.alternate : node.right;
    return [
      ...expressionVariants(left, bindings, seen),
      ...expressionVariants(right, bindings, seen),
    ];
  }
  if (
    node.type === "Identifier" &&
    bindings.has(node.name) &&
    !seen.has(node.name)
  ) {
    return expressionVariants(
      bindings.get(node.name),
      bindings,
      new Set([...seen, node.name]),
    );
  }
  return [];
}

function callName(callee) {
  if (callee?.type === "Identifier") return callee.name;
  if (
    callee?.type === "MemberExpression" &&
    !callee.computed &&
    callee.property.type === "Identifier"
  ) {
    return callee.property.name;
  }
  return null;
}

function joinPath(left, right) {
  const joined = `${left || ""}/${right || ""}`.replace(/\/{2,}/g, "/");
  return joined.length > 1 ? joined.replace(/\/$/, "") : joined;
}

function buildBackendManifest() {
  const appFile = path.join(ROOT, "server/src/app.js");
  const routeFiles = [
    appFile,
    path.join(ROOT, "server/src/shared/routes.js"),
    ...filesUnder("server/src", (file) => file.endsWith(".route.js")),
  ];
  const routers = new Map();
  const importsByFile = new Map();
  const exportsByFile = new Map();

  for (const file of routeFiles) {
    const ast = parseFile(file);
    const bindings = bindingsFor(ast);
    const imports = new Map();
    const exports = new Map();
    importsByFile.set(file, imports);
    exportsByFile.set(file, exports);

    for (const statement of ast.program.body) {
      if (statement.type === "ImportDeclaration") {
        const target = path.resolve(path.dirname(file), statement.source.value);
        for (const specifier of statement.specifiers) {
          const imported =
            specifier.type === "ImportDefaultSpecifier"
              ? "default"
              : specifier.imported.name;
          imports.set(specifier.local.name, { file: target, exported: imported });
        }
      } else if (
        statement.type === "ExportDefaultDeclaration" &&
        statement.declaration.type === "Identifier"
      ) {
        exports.set("default", statement.declaration.name);
      } else if (statement.type === "ExportNamedDeclaration") {
        for (const specifier of statement.specifiers) {
          exports.set(specifier.exported.name, specifier.local.name);
        }
      }
    }

    walk(ast, (node) => {
      if (
        node.type !== "CallExpression" ||
        node.callee.type !== "MemberExpression" ||
        node.callee.computed ||
        node.callee.object.type !== "Identifier" ||
        node.callee.property.type !== "Identifier"
      ) {
        return;
      }
      const routerName = node.callee.object.name;
      const operation = node.callee.property.name;
      if (!["get", "post", "put", "patch", "delete", "use"].includes(operation)) {
        return;
      }
      const key = `${file}#${routerName}`;
      if (!routers.has(key)) {
        routers.set(key, { file, routes: [], mounts: [] });
      }
      const router = routers.get(key);
      const prefixes = expressionVariants(node.arguments[0], bindings);
      if (operation === "use") {
        const prefix = prefixes[0] ?? "";
        const target = prefixes.length ? node.arguments.at(-1) : node.arguments[0];
        if (target?.type === "Identifier" && imports.has(target.name)) {
          router.mounts.push({ prefix, target: imports.get(target.name) });
        }
      } else {
        for (const routePath of prefixes) {
          router.routes.push({ method: operation.toUpperCase(), path: routePath });
        }
      }
    });
  }

  const resolveExport = ({ file, exported }) => {
    const local = exportsByFile.get(file)?.get(exported) || exported;
    return `${file}#${local}`;
  };
  const manifest = [];
  const visit = (key, prefix, stack = new Set()) => {
    if (stack.has(`${key}|${prefix}`)) return;
    const router = routers.get(key);
    if (!router) return;
    const nextStack = new Set([...stack, `${key}|${prefix}`]);
    for (const route of router.routes) {
      manifest.push({
        method: route.method,
        path: joinPath(prefix, route.path),
        sourceFile: sourcePath(router.file),
      });
    }
    for (const mount of router.mounts) {
      visit(resolveExport(mount.target), joinPath(prefix, mount.prefix), nextStack);
    }
  };
  visit(`${appFile}#app`, "");
  return manifest;
}

function inventoryFrontend(relativeDir) {
  const records = [];
  for (const file of filesUnder(relativeDir, (item) => /\.[jt]sx?$/.test(item))) {
    const ast = parseFile(file);
    const bindings = bindingsFor(ast);
    const fileName = sourcePath(file);
    walk(ast, (node) => {
      if (node.type !== "CallExpression") return;
      const helper = callName(node.callee);
      if (!HTTP_HELPERS.has(helper)) return;
      // Ignore a same-named local callback (for example `const getData = select.getData`).
      // Imported request helpers are not present in this VariableDeclarator binding map.
      if (bindings.has(helper)) return;

      let endpointNode = null;
      let methodNode = null;
      let fallbackMethod = "GET";
      if (["getData", "getDataAndSet", "useRequest"].includes(helper)) {
        endpointNode = objectProperty(node.arguments[0], "url");
        methodNode = objectProperty(node.arguments[0], "method");
      } else if (helper === "useDataFetcher") {
        endpointNode = node.arguments[0];
      } else if (helper === "handleRequestSubmit") {
        endpointNode = node.arguments[2];
        methodNode = node.arguments[6];
        fallbackMethod = "POST";
      } else {
        endpointNode = node.arguments[0];
        methodNode = objectProperty(node.arguments[1], "method");
      }

      const method = String(
        expressionVariants(methodNode, bindings)[0] || fallbackMethod,
      ).toUpperCase();
      records.push({
        file: fileName,
        line: node.loc?.start.line,
        helper,
        method,
        endpoints: expressionVariants(endpointNode, bindings),
      });
    });
  }
  return records;
}

function normalizeEndpoint(endpoint) {
  if (!endpoint) return null;
  if (/^https?:\/\//i.test(endpoint)) return { external: true, path: endpoint };
  if (/^:(API_|url|path|href|baseUrl|endpoint|notesPath)/.test(endpoint)) return null;
  const pathname = endpoint.split("?")[0].replace(/^\/?(?:v2\/)?/, "/v2/");
  return {
    external: false,
    path: pathname.replace(/\/{2,}/g, "/").replace(/\/$/, "") || "/v2",
  };
}

function routeMatches(routePath, requestPath) {
  const routeParts = routePath.split("/").filter(Boolean);
  const requestParts = requestPath.split("/").filter(Boolean);
  if (routeParts.length !== requestParts.length) return false;
  return routeParts.every(
    (part, index) =>
      part.startsWith(":") || requestParts[index].startsWith(":") || part === requestParts[index],
  );
}

function hasRoute(manifest, method, requestPath) {
  return manifest.some(
    (route) => route.method === method && routeMatches(route.path, requestPath),
  );
}

const ADAPTER_FILES = new Set([
  "web/src/app/helpers/functions/apiClient.js",
  "web/src/app/helpers/functions/getData.js",
  "web/src/app/helpers/functions/getDataAndSet.js",
  "web/src/app/helpers/functions/handleSubmit.js",
  "web/src/app/helpers/hooks/useDataFetcher.js",
  "courses-web/src/app/helpers/functions/apiClient.js",
  "courses-web/src/app/helpers/functions/getData.js",
  "courses-web/src/app/helpers/functions/getDataAndSet.js",
  "courses-web/src/app/helpers/functions/handleSubmit.js",
  "courses-web/src/app/helpers/hooks/useDataFetcher.js",
]);

const DYNAMIC_SOURCE_CONTRACTS = {
  "web/src/features/audit/AuditLogTable.jsx": {
    markers: ["AUDIT_LOGS_URL", "useDataFetcher"],
    routes: [["GET", "/v2/audit-logs"]],
  },
  "web/src/features/contracts/client/ContractSignature.jsx": {
    markers: ["client/contracts/generate-pdf"],
    routes: [["POST", "/v2/client/contracts/generate-pdf"]],
  },
  "web/src/features/contracts/ContractUtilityPage/dialogs/LevelClausesDialog.jsx": {
    markers: ["contract-utility/level-clauses"],
    routes: [
      ["POST", "/v2/site-utilities/contract-utility/level-clauses"],
      ["PUT", "/v2/site-utilities/contract-utility/level-clauses/:clauseId"],
    ],
  },
  "web/src/features/contracts/ContractUtilityPage/dialogs/SpecialClausesDialog.jsx": {
    markers: ["contract-utility/special-clauses"],
    routes: [
      ["POST", "/v2/site-utilities/contract-utility/special-clauses"],
      ["PUT", "/v2/site-utilities/contract-utility/special-clauses/:clauseId"],
    ],
  },
  "web/src/features/contracts/ContractUtilityPage/dialogs/StageClausesDialog.jsx": {
    markers: ["contract-utility/stage-clauses"],
    routes: [
      ["POST", "/v2/site-utilities/contract-utility/stage-clauses"],
      ["PUT", "/v2/site-utilities/contract-utility/stage-clauses/:clauseId"],
    ],
  },
  "web/src/features/image-session/admin/shared/OpenItemDialog.jsx": {
    markers: ["image-sessions/admin", "`${path}/${slug}`"],
    routes: [
      ["POST", "/v2/image-sessions/admin/space"],
      ["PUT", "/v2/image-sessions/admin/space/:id"],
      ["POST", "/v2/image-sessions/admin/material"],
      ["PUT", "/v2/image-sessions/admin/material/:id"],
      ["POST", "/v2/image-sessions/admin/style"],
      ["PUT", "/v2/image-sessions/admin/style/:id"],
      ["POST", "/v2/image-sessions/admin/colors"],
      ["PUT", "/v2/image-sessions/admin/colors/:id"],
      ["POST", "/v2/image-sessions/admin/images"],
      ["POST", "/v2/image-sessions/admin/images/bulk"],
      ["PUT", "/v2/image-sessions/admin/images/:id"],
      ["POST", "/v2/image-sessions/admin/page-info"],
      ["PUT", "/v2/image-sessions/admin/page-info/:id"],
    ],
  },
  "web/src/features/image-session/admin/shared/session-item/AutoCompleteSelector.jsx": {
    markers: ["resolvePickListUrl"],
    routes: [
      ["GET", "/v2/image-sessions/admin/templates/ids"],
      ["GET", "/v2/image-sessions/admin/style"],
      ["GET", "/v2/image-sessions/admin/space"],
      ["GET", "/v2/utilities/ids"],
    ],
  },
  "web/src/features/image-session/admin/shared/session-item/MultiAutoCompleteSelector.jsx": {
    markers: ["resolvePickListUrl"],
    routes: [
      ["GET", "/v2/image-sessions/admin/templates/ids"],
      ["GET", "/v2/image-sessions/admin/style"],
      ["GET", "/v2/image-sessions/admin/space"],
      ["GET", "/v2/utilities/ids"],
    ],
  },
  "web/src/features/image-session/admin/shared/Template.jsx": {
    markers: ["image-sessions/admin/templates", "isEdit ? \"PUT\" : \"POST\""],
    routes: [
      ["POST", "/v2/image-sessions/admin/templates"],
      ["PUT", "/v2/image-sessions/admin/templates/:templateId"],
    ],
  },
  "web/src/features/image-session/client-session/SignatureComponent.jsx": {
    markers: ["client/image-session/generate-pdf", "sessionStatus"],
    routes: [["POST", "/v2/client/image-session/generate-pdf"]],
  },
  "web/src/features/image-session/client-session/helpers.js": {
    markers: ["getDataAndSet", "url"],
    routes: [
      ["GET", "/v2/client/image-session/session"],
      ["GET", "/v2/client/image-session/pros-and-cons"],
    ],
  },
  "web/src/features/leads/context/LeadDetailsContext.jsx": {
    markers: ["call-reminders", "price-offers", "sales-stages/", "cockpit"],
    routes: [
      ["GET", "/v2/leads/:id/notes"],
      ["GET", "/v2/leads/:id/call-reminders"],
      ["GET", "/v2/leads/:id/meetings"],
      ["GET", "/v2/leads/:id/files"],
      ["GET", "/v2/leads/:id/price-offers"],
      ["GET", "/v2/sales-stages/:id"],
      ["GET", "/v2/leads/:id/cockpit"],
    ],
  },
  "web/src/features/leads/features/PreviewLead.jsx": {
    markers: ["leadBaseUrl", "getData"],
    routes: [
      ["GET", "/v2/leads/:id"],
      ["GET", "/v2/projects/designers/:id"],
    ],
  },
  "web/src/features/meeting/calendar/TimeSlotManager.jsx": {
    markers: ["calendar-management/available-days", "calendar-management/slots/"],
    routes: [
      ["POST", "/v2/calendar-management/available-days"],
      ["POST", "/v2/calendar-management/available-days/multiple"],
      ["DELETE", "/v2/calendar-management/slots/:slotId"],
    ],
  },
  "web/src/features/website-utilities/ContractPaymentConditions.jsx": {
    markers: ["site-utilities/contract-payment-conditions"],
    routes: [
      ["GET", "/v2/site-utilities/contract-payment-conditions"],
      ["POST", "/v2/site-utilities/contract-payment-conditions"],
      ["PUT", "/v2/site-utilities/contract-payment-conditions/:id"],
    ],
  },
  "web/src/features/website-utilities/PdfUtility.jsx": {
    markers: ["site-utilities/pdf-utility"],
    routes: [["GET", "/v2/site-utilities/pdf-utility"]],
  },
  "web/src/shared/components/common/EditFieldButton.jsx": {
    markers: ["reqType", "path"],
    routes: [
      ["POST", "/v2/admin/leads/update/:id"],
      ["PUT", "/v2/admin/client/update/:clientId"],
    ],
  },
  "web/src/shared/components/common/Notes.jsx": {
    markers: ["getNotesPath", "idKey", "attachment"],
    routes: [
      ["GET", "/v2/notes"],
      ["POST", "/v2/notes"],
      ["GET", "/v2/accounting/notes"],
      ["POST", "/v2/accounting/notes"],
      ["GET", "/v2/client/notes"],
      ["POST", "/v2/client/notes"],
    ],
  },
};

const GENERIC_COMPONENT_FILES = new Set([
  "web/src/shared/components/common/DeleteModelButton.jsx",
  "web/src/shared/components/models/CreateModal.jsx",
  "web/src/shared/components/models/DeleteModal.jsx",
  "web/src/shared/components/models/EditModal.jsx",
  "courses-web/src/shared/components/models/CreateModal.jsx",
  "courses-web/src/shared/components/models/DeleteModal.jsx",
  "courses-web/src/shared/components/models/EditModal.jsx",
]);

const GENERIC_CALLER_ROUTES = [
  ["POST", "/v2/users"],
  ["POST", "/v2/accounting/salaries/:userId"],
  ["POST", "/v2/accounting/rents"],
  ["POST", "/v2/accounting/payments/:paymentId/actions/pay"],
  ["POST", "/v2/accounting/operational-expenses"],
  ["POST", "/v2/admin/fixed-data"],
  ["PUT", "/v2/users/:userId"],
  ["PUT", "/v2/users/max-leads/:userId"],
  ["PUT", "/v2/users/max-leads-per-day/:userId"],
  ["PUT", "/v2/accounting/salaries/:salaryId"],
  ["PUT", "/v2/accounting/rents/:rentId"],
  ["PUT", "/v2/admin/fixed-data/:id"],
  ["DELETE", "/v2/delete/:id"],
  ["DELETE", "/v2/admin/fixed-data/:id"],
  ["DELETE", "/v2/admin/client-leads/:id"],
  ["DELETE", "/v2/image-session/:leadId/sessions/:sessionId"],
  ["DELETE", "/v2/courses/tests/:testId"],
  ["DELETE", "/v2/courses/:courseId/lessons/:lessonId"],
  ["DELETE", "/v2/courses/:courseId/lessons/:lessonId/allowed-users/:accessId"],
  [
    "DELETE",
    "/v2/courses/:courseId/lessons/:lessonId/videos/:videoId/pdfs/:pdfId",
  ],
];

describe("frontend/backend endpoint parity", () => {
  const manifest = buildBackendManifest();

  it("builds the backend manifest from app.js and the complete mounted router graph", () => {
    expect(manifest.length).toBeGreaterThan(400);
    expect(hasRoute(manifest, "GET", "/v2/auth/me")).toBe(true);
    expect(hasRoute(manifest, "POST", "/v2/client/stripe/webhook")).toBe(true);
    expect(hasRoute(manifest, "POST", "/v2/leads/:id/actions/change-status")).toBe(true);
    expect(hasRoute(manifest, "GET", "/v2/staff-courses/:courseId")).toBe(true);
  });

  it.each(["web/src", "courses-web/src"])(
    "matches every statically resolvable %s request to a mounted method/path",
    (sourceRoot) => {
      const inventory = inventoryFrontend(sourceRoot);
      const dynamicFiles = new Set(Object.keys(DYNAMIC_SOURCE_CONTRACTS));
      const skipped = new Set([...ADAPTER_FILES, ...dynamicFiles, ...GENERIC_COMPONENT_FILES]);
      const records = inventory
        .filter((record) => !skipped.has(record.file))
        .flatMap((record) =>
          record.endpoints.length
            ? record.endpoints.map((endpoint) => ({ ...record, endpoint }))
            : [{ ...record, endpoint: null }],
        );

      const unresolved = records.filter((record) => !normalizeEndpoint(record.endpoint));
      expect(unresolved, "new dynamic callers need an explicit checked contract").toEqual([]);

      const external = records.filter(
        (record) => normalizeEndpoint(record.endpoint)?.external,
      );
      expect(external.map((record) => record.endpoint)).toEqual(
        sourceRoot === "web/src" ? ["https://geolocation-db.com/json/"] : [],
      );

      const unmatched = records.filter((record) => {
        const endpoint = normalizeEndpoint(record.endpoint);
        return (
          endpoint &&
          !endpoint.external &&
          !hasRoute(manifest, record.method, endpoint.path)
        );
      });
      expect(unmatched).toEqual([]);

      const unique = new Set(
        records
          .map((record) => normalizeEndpoint(record.endpoint))
          .filter((endpoint) => endpoint && !endpoint.external)
          .map((endpoint) => endpoint.path),
      );
      expect(unique.size).toBeGreaterThan(sourceRoot === "web/src" ? 150 : 45);
    },
  );

  it("keeps every prop-driven/dynamic caller tied to checked mounted routes", () => {
    for (const [file, contract] of Object.entries(DYNAMIC_SOURCE_CONTRACTS)) {
      const source = fs.readFileSync(path.join(ROOT, file), "utf8");
      for (const marker of contract.markers) expect(source).toContain(marker);
      for (const [method, routePath] of contract.routes) {
        expect(hasRoute(manifest, method, routePath), `${method} ${routePath}`).toBe(true);
      }
    }
    for (const [method, routePath] of GENERIC_CALLER_ROUTES) {
      expect(hasRoute(manifest, method, routePath), `${method} ${routePath}`).toBe(true);
    }
  });

  it("locks the corrected lead, image-admin, accounting-notes, and upload contracts", () => {
    const kanban = fs.readFileSync(
      path.join(ROOT, "web/src/features/Kanban/staff/KanbanColumn.jsx"),
      "utf8",
    );
    expect(kanban).toContain('isNotStaff ? "projects/designers" : "leads"');
    expect(kanban).not.toContain('isNotStaff ? "projects/designers" : "client-leads"');

    const notes = fs.readFileSync(
      path.join(ROOT, "web/src/shared/components/common/Notes.jsx"),
      "utf8",
    );
    expect(notes).toContain('slug = "accounting"');

    const imageDialog = fs.readFileSync(
      path.join(
        ROOT,
        "web/src/features/image-session/admin/shared/OpenItemDialog.jsx",
      ),
      "utf8",
    );
    expect(imageDialog).toContain('path = "image-sessions/admin"');
    expect(imageDialog).not.toContain('path = "admin"');

    const createColor = fs.readFileSync(
      path.join(
        ROOT,
        "web/src/features/image-session/admin/color/CreateColor.jsx",
      ),
      "utf8",
    );
    expect(createColor).toContain("data.imageUrl = uploadResponse.url");
    expect(createColor).not.toContain("data.imageUrl = fileUpload.url");

    for (const appRoot of ["web", "courses-web"]) {
      const upload = fs.readFileSync(
        path.join(ROOT, appRoot, "src/app/helpers/functions/uploadAsChunk.js"),
        "utf8",
      );
      expect(upload).toContain('formData.append("chunk"');
      expect(upload).toContain("files/chunks");
    }
  });

  it("matches Socket.IO authentication and event names", () => {
    const chatHook = fs.readFileSync(
      path.join(ROOT, "web/src/features/chat/hooks/useSocket.js"),
      "utf8",
    );
    expect(chatHook).toContain('error: "onChatError"');
    expect(chatHook).not.toContain('"chat:error"');

    const coursesNotifications = fs.readFileSync(
      path.join(
        ROOT,
        "courses-web/src/shared/components/utility/NotificationIcon.jsx",
      ),
      "utf8",
    );
    expect(coursesNotifications).toContain("withCredentials: true");
    expect(coursesNotifications).not.toContain('socket.emit("join-room"');
    expect(coursesNotifications).not.toContain('socket.emit("heartbeat"');
    expect(coursesNotifications).not.toContain("query: { userId");

    const serverHandlers = filesUnder(
      "server/src/modules/chat/handlers",
      (file) => file.endsWith(".js"),
    )
      .map((file) => fs.readFileSync(file, "utf8"))
      .join("\n");
    expect(serverHandlers).toContain('socket.emit("error"');
    expect(serverHandlers).not.toContain('socket.emit("chat:error"');
  });

  it("keeps the API adapters on /v2 with CSRF and refresh endpoints in the manifest", () => {
    for (const appRoot of ["web", "courses-web"]) {
      const source = fs.readFileSync(
        path.join(ROOT, appRoot, "src/app/helpers/functions/apiClient.js"),
        "utf8",
      );
      expect(source).toContain('`${API_ORIGIN}/v2`');
      expect(source).toContain('`${API_BASE}/auth/csrf`');
      expect(source).toContain('`${API_BASE}/auth/refresh`');
      expect(source).toContain('credentials: "include"');
    }
    expect(hasRoute(manifest, "GET", "/v2/auth/csrf")).toBe(true);
    expect(hasRoute(manifest, "POST", "/v2/auth/refresh")).toBe(true);
  });
});
