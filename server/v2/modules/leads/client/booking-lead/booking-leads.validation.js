const TEXT_FIELDS = new Set([
  "location",
  "projectType",
  "projectStage",
  "previousWork",
  "hasArchitecturalPlan",
  "serviceType",
  "decisionMaker",
  "name",
  "phone",
  "email",
]);

const BOOLEAN_FIELDS = new Set([
  "contactAgreement",
  "contactInitialPriceAgreement",
]);

const LEAD_FIELDS = new Set([
  "location",
  "projectType",
  "projectStage",
  "previousWork",
  "hasArchitecturalPlan",
  "serviceType",
  "decisionMaker",
]);

const CLIENT_FIELDS = new Set([
  "name",
  "phone",
  "email",
  "contactAgreement",
  "contactInitialPriceAgreement",
]);

const ALL_ALLOWED_FIELDS = [...LEAD_FIELDS, ...CLIENT_FIELDS];

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[0-9+()\-\s]{6,20}$/;

function createValidationError(message) {
  const error = new Error(message);
  error.status = 400;
  return error;
}

function ensureObjectPayload(payload) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw createValidationError("Request body must be a JSON object");
  }

  return payload;
}

function validateTextField(field, value, { required = false } = {}) {
  if (typeof value !== "string") {
    throw createValidationError(`${field} must be a string`);
  }

  const normalizedValue = value.trim();

  if (required && !normalizedValue) {
    throw createValidationError(`${field} is required`);
  }

  if (!normalizedValue) {
    return null;
  }

  if (field === "email" && !EMAIL_REGEX.test(normalizedValue)) {
    throw createValidationError("email must be a valid email address");
  }

  if (field === "phone" && !PHONE_REGEX.test(normalizedValue)) {
    throw createValidationError("phone must be a valid phone number");
  }

  return normalizedValue;
}

function validateBooleanField(field, value, { requireTrue = false } = {}) {
  if (typeof value !== "boolean") {
    throw createValidationError(`${field} must be a boolean`);
  }

  if (requireTrue && value !== true) {
    throw createValidationError(`${field} must be accepted`);
  }

  return value;
}

function validateField(field, value, options = {}) {
  if (TEXT_FIELDS.has(field)) {
    return validateTextField(field, value, options);
  }

  if (BOOLEAN_FIELDS.has(field)) {
    return validateBooleanField(field, value, options);
  }

  throw createValidationError(`${field} is not allowed`);
}

export function validateLeadIdParam(leadIdParam) {
  const leadId = Number(leadIdParam);

  if (!Number.isInteger(leadId) || leadId <= 0) {
    throw createValidationError("leadId must be a positive integer");
  }

  return leadId;
}

export function validateCreateBookingLeadInput(payload) {
  const body = ensureObjectPayload(payload);

  return {
    name: validateField("name", body.name, { required: true }),
    phone: validateField("phone", body.phone, { required: true }),
  };
}

export function validatePatchBookingLeadInput(payload) {
  const body = ensureObjectPayload(payload);
  const definedKeys = Object.keys(body).filter(
    (key) => body[key] !== undefined,
  );

  if (definedKeys.length !== 1) {
    throw createValidationError(
      "PATCH requires exactly one supported field per request",
    );
  }

  const [field] = definedKeys;

  if (!ALL_ALLOWED_FIELDS.includes(field)) {
    throw createValidationError(`${field} is not allowed`);
  }

  return {
    field,
    value: validateField(field, body[field], { required: true }),
  };
}

export function validateSubmitBookingLeadInput(payload) {
  const body = ensureObjectPayload(payload);
  const validatedPayload = {};

  for (const field of ALL_ALLOWED_FIELDS) {
    validatedPayload[field] = validateField(field, body[field], {
      required: true,
      requireTrue:
        field === "contactAgreement" ||
        field === "contactInitialPriceAgreement",
    });
  }

  return validatedPayload;
}

export function isLeadField(field) {
  return LEAD_FIELDS.has(field);
}

export function isClientField(field) {
  return CLIENT_FIELDS.has(field);
}
