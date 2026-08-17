import { FORM_VALIDATION_MESSAGES as FORM_ERRORS } from "@dms/shared";

export const resetInputs = [
    {
        data: {
            id: "email",
            type: "email",
            name: "email",
            label: "Email",
        },
        pattern: {
            required: {
                value: true,
                message: FORM_ERRORS.ENTER_EMAIL,
            },
            pattern: {
                value: /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/,
                message: FORM_ERRORS.INVALID_EMAIL_ADDRESS,
            },
        },
    },
];

export const resetPasswordInputs = [
    {
        data: {
            id: "password",
            type: "password",
            label: "Password",
            name: "password",
        },
        pattern: {
            required: {
                value: true,
                message: FORM_ERRORS.ENTER_PASSWORD,
            },
            pattern: {
                value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d!@#$%^&*()_+~`|}{[\]:;?><,./-=]{8,}$/,
                message: FORM_ERRORS.PASSWORD_COMPLEXITY,
            },
        },
    },
    {
        data: {
            id: "confirmPassword",
            type: "password",
            label: "Confirm Password",
            name: "confirmPassword",
        },
        pattern: {
            required: {
                value: true,
                message: FORM_ERRORS.CONFIRM_PASSWORD,
            },
            validate: {
                matchesPreviousPassword: (value) => {
                    const password = document.getElementById("password").value;
                    return password === value || FORM_ERRORS.PASSWORDS_DO_NOT_MATCH;
                },
            },
        },
    },
];
