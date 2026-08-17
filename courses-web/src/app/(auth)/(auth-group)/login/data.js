import { FORM_VALIDATION_MESSAGES as FORM_ERRORS } from "@dms/shared";

export const loginInputs = [
    {
        data: {
            id: "email",
            type: "email",
            label: "Email",
            name: "email",
        },
        pattern: {
            required: {
                value: true,
                message: FORM_ERRORS.ENTER_EMAIL,
            },
            pattern: {
                value: /\w+@[a-z]+\.[a-z]{2,}/gi,
                message: FORM_ERRORS.INVALID_EMAIL_ADDRESS,
            },
        },
    },
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
        },
    },
];
