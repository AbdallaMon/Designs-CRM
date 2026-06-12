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
                message: "Please enter your email",
            },
            pattern: {
                value: /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/,
                message: "Please enter a valid email address",
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
                message: "Please enter your password",
            },
            pattern: {
                value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d!@#$%^&*()_+~`|}{[\]:;?><,./-=]{8,}$/,
                message: "Password must contain at least one uppercase letter, one lowercase letter, and one number, and be at least 8 characters long",
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
                message: "Please confirm your password",
            },
            validate: {
                matchesPreviousPassword: (value) => {
                    const password = document.getElementById("password").value;
                    return password === value || "Passwords do not match";
                },
            },
        },
    },
];
