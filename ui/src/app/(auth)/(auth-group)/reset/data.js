export const resetInputs = [
    {
        data: {
            id: "email",
            type: "email",
            name: "email",
            label: "البريد الالكتروني",
        },
        pattern: {
            required: {
                value: true,
                message: "الرجاء إدخال البريد الإلكتروني",
            },
            pattern: {
                value: /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/,
                message: "الرجاء إدخال بريد إلكتروني صحيح",
            },
        },
    },
];
export const resetPasswordInputs = [
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
                message: "الرجاء إدخال  كلمة المرور",
            },
            pattern: {
                value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d!@#$%^&*()_+~`|}{[\]:;?><,./-=]{8,}$/,
                message:
                      "يجب أن تحتوي كلمة المرور على حرف كبير وحرف صغير ورقم وأن تكون 8 أحرف على الأقل",
            },
        },
    },
    {
        data: {
            id: "confirmPassword",
            type: "password",
            label: "تأكيد كلمة المرور",
            name: "confirmPassword",
        },
        pattern: {
            required: {
                value: true,
                message: " يجب تأكيد كلمة المرور",
            },
            validate: {
                matchesPreviousPassword: (value) => {
                    const password = document.getElementById("password").value;
                    return password === value || "كلمة المرور غير متطابقة";
                },
            },
        },
    },
];
