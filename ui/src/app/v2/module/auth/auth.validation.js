/**
 * React Hook Form validation rules for auth forms.
 */

export const emailRules = {
  required: {
    value: true,
    message: "Please enter your email",
  },
  pattern: {
    value: /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
    message: "Please enter a valid email address",
  },
};

export const passwordRules = {
  required: {
    value: true,
    message: "Please enter your password",
  },
  pattern: {
    value:
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d!@#$%^&*()_+~`|}{[\]:;?><,./-=]{8,}$/,
    message:
      "Password must contain at least one uppercase letter, one lowercase letter, and one digit, and be at least 8 characters long",
  },
};

/**
 * Returns validation rules for the confirmPassword field.
 * @param {Function} getValues - React Hook Form getValues function
 */
export const confirmPasswordRules = (getValues) => ({
  required: {
    value: true,
    message: "Please confirm your password",
  },
  validate: {
    matchesPreviousPassword: (value) =>
      getValues("password") === value || "Passwords do not match",
  },
});
