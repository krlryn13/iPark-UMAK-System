const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const userModel = require('../models/userModel');
const { sendVerificationEmail } = require('../services/emailService');
const { validatePassword } = require('../utils/passwordValidator');
const { handleServerError } = require('../utils/errorHandler');

const UMAK_DOMAIN = '@umak.edu.ph';
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;

// Helper to generate 6-digit verification code
const generateVerificationCode = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

// GET /api/auth/me — Validate token and return user data
const getMe = (req, res) => {
    userModel.findById(req.user.id, (err, results) => {
        if (err) return handleServerError(res, err, 'Failed to fetch user profile.');
        if (results.length === 0) return res.status(404).json({ error: 'User not found.' });

        const user = results[0];
        res.json({
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                is_verified: user.is_verified
            }
        });
    });
};

// REGISTER USER
const register = (req, res) => {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({ error: 'Please provide all required fields (name, email, password).' });
    }

    const cleanEmail = email.trim().toLowerCase();

    // Enforce @umak.edu.ph domain
    if (!cleanEmail.endsWith(UMAK_DOMAIN)) {
        return res.status(400).json({ 
            error: `Registration restricted: You must use an official ${UMAK_DOMAIN} email address (e.g. k12345678@umak.edu.ph).` 
        });
    }

    // Enforce strong password policy
    const passwordErrors = validatePassword(password);
    if (passwordErrors.length > 0) {
        return res.status(400).json({
            error: 'Password does not meet security requirements.',
            passwordErrors
        });
    }

    // Check if email already registered
    userModel.findByEmail(cleanEmail, async (err, results) => {
        if (err) return handleServerError(res, err, 'Registration error. Please try again.');
        if (results.length > 0) {
            const existingUser = results[0];
            if (existingUser.is_verified === 1) {
                return res.status(400).json({ error: 'Email address is already registered. Please Sign In instead.' });
            } else {
                // User exists but not verified yet: resend new code
                const newCode = generateVerificationCode();
                userModel.updateVerificationCode(cleanEmail, newCode, async (updErr) => {
                    if (updErr) return handleServerError(res, updErr, 'Failed to update verification code.');
                    try {
                        await sendVerificationEmail(cleanEmail, existingUser.name, newCode);
                    } catch (mailErr) {
                        console.error('[EMAIL ERROR]', mailErr.message);
                    }
                    return res.json({
                        message: `A new verification code has been sent to ${cleanEmail}. Please check your inbox.`,
                        email: cleanEmail,
                        requiresVerification: true
                    });
                });
                return;
            }
        }

        try {
            const hashedPassword = await bcrypt.hash(password, 10);
            const vCode = generateVerificationCode();

            userModel.createUser({ 
                name: name.trim(), 
                email: cleanEmail, 
                password: hashedPassword, 
                role: 'student',
                verification_code: vCode,
                is_verified: 0
            }, async (err, result) => {
                if (err) return handleServerError(res, err, 'Account creation failed. Email address may already be registered.');

                try {
                    await sendVerificationEmail(cleanEmail, name.trim(), vCode);
                } catch (mailErr) {
                    console.error('[EMAIL ERROR]', mailErr.message);
                }

                res.status(201).json({
                    message: `A 6-digit verification code has been sent to ${cleanEmail}. Please check your inbox.`,
                    email: cleanEmail,
                    requiresVerification: true
                });
            });
        } catch (hashErr) {
            res.status(500).json({ error: 'Password encryption error.' });
        }
    });
};

// VERIFY 6-DIGIT CODE
const verifyCode = (req, res) => {
    const { email, code } = req.body;

    if (!email || !code) {
        return res.status(400).json({ error: 'Please enter your email and 6-digit verification code.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanCode = code.trim();

    userModel.findByEmail(cleanEmail, (err, results) => {
        if (err) return handleServerError(res, err, 'Verification error.');
        if (results.length === 0) {
            return res.status(404).json({ error: 'User account not found.' });
        }

        const user = results[0];

        if (user.is_verified === 1) {
            return res.json({ message: 'Account is already verified. You can Sign In now.' });
        }

        if (user.verification_code !== cleanCode) {
            return res.status(400).json({ error: 'Invalid 6-digit verification code. Please check and try again.' });
        }

        // Code matches! Verify user
        userModel.verifyUserCode(cleanEmail, cleanCode, (verErr) => {
            if (verErr) return handleServerError(res, verErr, 'Account verification failed.');

            const userData = { id: user.id, name: user.name, email: user.email, role: user.role, is_verified: 1 };
            const token = jwt.sign(
                { id: user.id, email: user.email, role: user.role },
                process.env.JWT_SECRET,
                { expiresIn: '24h' }
            );

            res.json({
                message: 'Account verified successfully! Welcome to iPark UMAK.',
                user: userData,
                token
            });
        });
    });
};

// RESEND CODE
const resendCode = (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required.' });

    const cleanEmail = email.trim().toLowerCase();
    const newCode = generateVerificationCode();

    userModel.findByEmail(cleanEmail, async (findErr, results) => {
        if (findErr) return handleServerError(res, findErr, 'User lookup failed.');
        if (results.length === 0) return res.status(404).json({ error: 'User not found.' });

        const userName = results[0].name || 'Heron';

        userModel.updateVerificationCode(cleanEmail, newCode, async (err) => {
            if (err) return handleServerError(res, err, 'Code update failed.');
            try {
                await sendVerificationEmail(cleanEmail, userName, newCode);
            } catch (mailErr) {
                console.error('[EMAIL ERROR]', mailErr.message);
                return res.status(500).json({ error: 'Failed to send email. Please try again later.' });
            }
            res.json({
                message: `A new verification code has been sent to ${cleanEmail}. Please check your inbox.`,
                requiresVerification: true
            });
        });
    });
};

// LOGIN USER (with account lockout protection)
const login = (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Please enter your @umak.edu.ph email and password.' });
    }

    const cleanEmail = email.trim().toLowerCase();

    // Enforce @umak.edu.ph domain check
    if (!cleanEmail.endsWith(UMAK_DOMAIN)) {
        return res.status(400).json({ 
            error: `Invalid email domain: Only official ${UMAK_DOMAIN} accounts can access iPark UMAK.` 
        });
    }

    userModel.findByEmail(cleanEmail, async (err, results) => {
        if (err) return handleServerError(res, err, 'Sign in error.');
        if (results.length === 0) {
            return res.status(401).json({ error: 'Account not found. Please Sign Up for a new Heron account.' });
        }

        const user = results[0];

        // Check if account is locked
        if (user.locked_until) {
            const lockExpiry = new Date(user.locked_until);
            if (lockExpiry > new Date()) {
                const minutesLeft = Math.ceil((lockExpiry - new Date()) / 60000);
                return res.status(423).json({
                    error: `Account locked due to 5 failed login attempts. Automatically unlocks in ${minutesLeft} minute${minutesLeft !== 1 ? 's' : ''}, or you can request OHSO Admin to unlock it now.`,
                    isLocked: true,
                    email: cleanEmail,
                    unlockRequested: user.unlock_requested === 1
                });
            }
            // Lock has expired — reset it
            userModel.resetFailedAttempts(cleanEmail, () => {});
        }

        try {
            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                // Increment failed attempts
                const newAttempts = (user.failed_login_attempts || 0) + 1;

                if (newAttempts >= MAX_FAILED_ATTEMPTS) {
                    // Lock the account
                    userModel.lockAccount(cleanEmail, LOCKOUT_MINUTES, () => {});
                    return res.status(423).json({
                        error: `Account locked for ${LOCKOUT_MINUTES} minutes due to ${MAX_FAILED_ATTEMPTS} consecutive failed login attempts. You can request OHSO Admin to unlock it.`,
                        isLocked: true,
                        email: cleanEmail,
                        unlockRequested: false
                    });
                }

                userModel.incrementFailedAttempts(cleanEmail, () => {});
                const remaining = MAX_FAILED_ATTEMPTS - newAttempts;
                return res.status(401).json({
                    error: `Incorrect password. ${remaining} attempt${remaining !== 1 ? 's' : ''} remaining before account lockout.`
                });
            }

            // Successful login — reset failed attempts
            userModel.resetFailedAttempts(cleanEmail, () => {});

            // Check if user is verified
            if (user.is_verified === 0) {
                // Generate new code and send via email only — NEVER expose code in response
                const newCode = generateVerificationCode();
                userModel.updateVerificationCode(cleanEmail, newCode, async () => {
                    try {
                        await sendVerificationEmail(cleanEmail, user.name, newCode);
                    } catch (mailErr) {
                        console.error('[EMAIL ERROR]', mailErr.message);
                    }
                });
                return res.status(403).json({ 
                    error: 'Your account is not verified yet. A new verification code has been sent to your email.',
                    requiresVerification: true,
                    email: cleanEmail
                });
            }

            const userData = { id: user.id, name: user.name, email: user.email, role: user.role, is_verified: 1 };
            const token = jwt.sign(
                { id: user.id, email: user.email, role: user.role },
                process.env.JWT_SECRET,
                { expiresIn: '24h' }
            );

            res.json({
                message: 'Login successful! Welcome back.',
                user: userData,
                token
            });
        } catch (compErr) {
            res.status(500).json({ error: 'Password verification error.' });
        }
    });
};

// USER REQUEST UNLOCK
const requestUnlock = (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required.' });

    const cleanEmail = email.trim().toLowerCase();

    userModel.findByEmail(cleanEmail, (err, results) => {
        if (err) return handleServerError(res, err, 'Unlock request error.');
        if (results.length === 0) return res.status(404).json({ error: 'User account not found.' });

        const user = results[0];
        const isCurrentlyLocked = user.locked_until && new Date(user.locked_until) > new Date();

        if (!isCurrentlyLocked) {
            return res.status(400).json({ error: 'This account is not currently locked.' });
        }

        userModel.requestUnlock(cleanEmail, (updErr) => {
            if (updErr) return handleServerError(res, updErr, 'Unlock request failed.');
            res.json({
                message: `Unlock request submitted successfully! OHSO Admin has been notified.`
            });
        });
    });
};

// ADMIN GET ALL USERS
const getAllUsersAdmin = (req, res) => {
    userModel.getAllUsersAdmin((err, results) => {
        if (err) return handleServerError(res, err, 'Failed to fetch user accounts.');
        res.json(results);
    });
};

// ADMIN UNLOCK USER
const adminUnlockUser = (req, res) => {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: 'User ID is required.' });

    userModel.findById(userId, (findErr, results) => {
        if (findErr) return handleServerError(res, findErr, 'User lookup failed.');
        if (results.length === 0) return res.status(404).json({ error: 'User not found.' });

        const user = results[0];

        userModel.adminUnlockUser(userId, async (updErr) => {
            if (updErr) return handleServerError(res, updErr, 'Failed to unlock user account.');

            // Send notification email asynchronously
            const { sendAccountUnlockedEmail } = require('../services/emailService');
            sendAccountUnlockedEmail(user.email, user.name).catch(console.error);

            res.json({
                message: `User account (${user.email}) unlocked successfully by OHSO Admin.`
            });
        });
    });
};

module.exports = {
    register,
    verifyCode,
    resendCode,
    login,
    getMe,
    requestUnlock,
    getAllUsersAdmin,
    adminUnlockUser
};
