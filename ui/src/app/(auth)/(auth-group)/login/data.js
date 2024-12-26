export const loginInputs = [
    {
        data: {
            id: "email",
            type: "email",
            label: "البريد الإلكتروني",
            name: "email",
        },
        pattern: {
            required: {
                value: true,
                message: "الرجاء إدخال البريد الإلكتروني",
            },
            pattern: {
                value: /\w+@[a-z]+\.[a-z]{2,}/gi,
                message: "الرجاء إدخال بريد إلكتروني صحيح",
            },
        },
    },
    {
        data: {
            id: "password",
            type: "password",
            label: "كلمة المرور",
            name: "password",
        },
        pattern: {
            required: {
                value: true,
                message: "الرجاء إدخال كلمة المرور",
            },
        },
    },
];
