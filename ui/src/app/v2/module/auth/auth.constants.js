/**
 * Static field shape definitions for auth forms.
 * Validation rules are kept separate in auth.validation.js.
 */

export const LOGIN_FIELDS = [
  {
    id: "email",
    name: "email",
    type: "email",
    label: "Email",
  },
  {
    id: "password",
    name: "password",
    type: "password",
    label: "Password",
  },
];

export const REQUEST_RESET_FIELDS = [
  {
    id: "email",
    name: "email",
    type: "email",
    label: "Email",
  },
];

export const RESET_PASSWORD_FIELDS = [
  {
    id: "password",
    name: "password",
    type: "password",
    label: "Password",
  },
  {
    id: "confirmPassword",
    name: "confirmPassword",
    type: "password",
    label: "Confirm Password",
  },
];
