

const PASSWORD_RULES = {
    minLength: 12,
    requireUppercase: /[A-Z]/,
    requireLowercase: /[a-z]/,
    requireNumber: /[0-9]/,
    requireSpecial: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/
};

const validatePassword = (password) => {
    const errors = [];

    if (!password || password.length < PASSWORD_RULES.minLength) {
        errors.push('Password must be at least 12 characters.');
    }
    if (!PASSWORD_RULES.requireUppercase.test(password)) {
        errors.push('Must contain at least 1 uppercase letter (A-Z).');
    }
    if (!PASSWORD_RULES.requireLowercase.test(password)) {
        errors.push('Must contain at least 1 lowercase letter (a-z).');
    }
    if (!PASSWORD_RULES.requireNumber.test(password)) {
        errors.push('Must contain at least 1 number (0-9).');
    }
    if (!PASSWORD_RULES.requireSpecial.test(password)) {
        errors.push('Must contain at least 1 special character (!@#$%^&*...).');
    }

    return errors;
};

module.exports = { validatePassword, PASSWORD_RULES };
