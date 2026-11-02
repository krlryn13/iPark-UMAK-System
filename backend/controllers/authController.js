const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const userModel = require('../models/userModel');
const { sendVerificationEmail } = require('../services/emailService');
const { validatePassword } = require('../utils/passwordValidator');
const { handleServerError } = require('../utils/errorHandler');
const { encryptAES256, decryptAES256 } = require('../utils/encryption');
const { logAudit } = require('../services/auditService');

const UMAK_DOMAIN = '@umak.edu.ph';
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;
const JWT_SECRET = process.env.JWT_SECRET || 'ipark_umak_2026_s3cr3t_jwt_key_x7k2m9';


const generateVerificationCode = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

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
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({ error: 'Please provide all required fields (name, email, password).' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const userRole = (role && (role.toLowerCase() === 'faculty' || role.toLowerCase() === 'staff')) ? 'faculty' : 'student';

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
                userModel.updateVerificationCode(cleanEmail, encryptAES256(newCode), async (updErr) => {
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
                role: userRole,
                verification_code: encryptAES256(vCode),
                is_verified: 0
            }, async (err, result) => {
                if (err) return handleServerError(res, err, 'Account creation failed. Email address may already be registered.');

                logAudit({
                    req,
                    category: 'auth',
                    action: 'REGISTER',
                    actor: { id: result.insertId, email: cleanEmail, role: userRole },
                    description: `Registered new ${userRole} account`
                });

                // Send email asynchronously in background so client response is instant
                sendVerificationEmail(cleanEmail, name.trim(), vCode).catch(mailErr => {
                    console.error('[EMAIL ERROR]', mailErr.message);
                });

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

// VERIFY 6-DIGIT CODE (WITH 3-ATTEMPT LOCKOUT & TIMEOUT)
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

        // 1. Check if account is currently locked due to 3 failed attempts
        if (user.locked_until && new Date(user.locked_until) > new Date()) {
            const minutesLeft = Math.ceil((new Date(user.locked_until) - new Date()) / 60000);
            return res.status(423).json({
                error: `Security Lockout: Too many failed verification attempts (3/3). Account is locked for ${minutesLeft} more minute(s). You can request an OHSO Admin unlock or try again later.`,
                isLocked: true,
                unlockRequested: !!user.unlock_requested
            });
        }

        if (user.is_verified === 1) {
            return res.json({ message: 'Account is already verified. You can Sign In now.' });
        }

        // 2. Incorrect code attempt handling
        if (decryptAES256(user.verification_code) !== cleanCode) {
            const currentFailed = (user.failed_login_attempts || 0) + 1;

            if (currentFailed >= 3) {
                // Lock account for 15 minutes after 3 failed attempts
                userModel.lockAccount(cleanEmail, LOCKOUT_MINUTES, (lockErr) => {
                    if (lockErr) console.error('[LOCKOUT ERROR]', lockErr.message);
                });

                logAudit({
                    req,
                    category: 'auth',
                    action: 'ACCOUNT_LOCKED',
                    status: 'failed',
                    actor: { id: user.id, email: user.email, role: user.role },
                    description: 'Account locked (3 failed verification attempts)'
                });

                return res.status(423).json({
                    error: `Security Lockout: 3 consecutive wrong verification codes entered (3/3). Account is locked for ${LOCKOUT_MINUTES} minutes for security. Please request an admin unlock or wait 15 minutes.`,
                    isLocked: true,
                    unlockRequested: !!user.unlock_requested
                });
            } else {
                // Increment failed attempts count
                userModel.incrementFailedAttempts(cleanEmail, () => { });
                const attemptsRemaining = 3 - currentFailed;
                return res.status(400).json({
                    error: `Invalid 6-digit verification code. Failed attempt (${currentFailed}/3). ${attemptsRemaining} attempt(s) remaining before security timeout lock.`
                });
            }
        }

        // 3. Code matches! Reset failed attempts and verify user
        userModel.resetFailedAttempts(cleanEmail, () => { });

        userModel.verifyUserCode(cleanEmail, (verErr) => {
            if (verErr) return handleServerError(res, verErr, 'Account verification failed.');

            logAudit({
                req,
                category: 'auth',
                action: 'EMAIL_VERIFIED',
                actor: { id: user.id, email: user.email, role: user.role },
                description: 'Email address verified'
            });

            const userData = { id: user.id, name: user.name, email: user.email, role: user.role, is_verified: 1 };
            const token = jwt.sign(
                { id: user.id, name: user.name, email: user.email, role: user.role },
                JWT_SECRET,
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

        userModel.updateVerificationCode(cleanEmail, encryptAES256(newCode), async (err) => {
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
            return res.status(401).json({ error: 'Invalid @umak.edu.ph email or password. Please verify your credentials or Sign Up.' });
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
            userModel.resetFailedAttempts(cleanEmail, () => { });
        }

        try {
            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                // Increment failed attempts
                const newAttempts = (user.failed_login_attempts || 0) + 1;

                if (newAttempts >= MAX_FAILED_ATTEMPTS) {
                    // Lock the account
                    userModel.lockAccount(cleanEmail, LOCKOUT_MINUTES, () => { });

                    logAudit({
                        req,
                        category: 'auth',
                        action: 'ACCOUNT_LOCKED',
                        status: 'failed',
                        actor: { id: user.id, email: user.email, role: user.role },
                        description: `Account locked (${MAX_FAILED_ATTEMPTS} failed password attempts)`
                    });

                    return res.status(423).json({
                        error: `Account locked for ${LOCKOUT_MINUTES} minutes due to ${MAX_FAILED_ATTEMPTS} consecutive failed login attempts. You can request OHSO Admin to unlock it.`,
                        isLocked: true,
                        email: cleanEmail,
                        unlockRequested: false
                    });
                }

                userModel.incrementFailedAttempts(cleanEmail, () => { });

                logAudit({
                    req,
                    category: 'auth',
                    action: 'LOGIN_FAILED',
                    status: 'failed',
                    actor: { id: user.id, email: user.email, role: user.role },
                    description: `Failed password login (${newAttempts}/${MAX_FAILED_ATTEMPTS})`
                });

                const remaining = MAX_FAILED_ATTEMPTS - newAttempts;
                return res.status(401).json({
                    error: `Invalid credentials. ${remaining} attempt${remaining !== 1 ? 's' : ''} remaining before account lockout.`
                });
            }

            // Successful login — reset failed attempts
            userModel.resetFailedAttempts(cleanEmail, () => { });

            // Check if user is verified
            if (user.is_verified === 0) {
                // Generate new code and send via email only — NEVER expose code in response
                const newCode = generateVerificationCode();
                userModel.updateVerificationCode(cleanEmail, encryptAES256(newCode), async () => {
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

            logAudit({
                req,
                category: 'auth',
                action: 'LOGIN_SUCCESS',
                actor: { id: user.id, email: user.email, role: user.role },
                description: 'Signed in with password'
            });

            const userData = { id: user.id, name: user.name, email: user.email, role: user.role, is_verified: 1 };
            const token = jwt.sign(
                { id: user.id, name: user.name, email: user.email, role: user.role },
                JWT_SECRET,
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

            logAudit({
                req,
                category: 'admin',
                action: 'USER_UNLOCKED',
                targetType: 'user',
                targetId: user.id,
                description: `Unlocked account for ${user.email}`
            });

            // Send notification email asynchronously
            const { sendAccountUnlockedEmail } = require('../services/emailService');
            sendAccountUnlockedEmail(user.email, user.name).catch(console.error);

            res.json({
                message: `User account (${user.email}) unlocked successfully by OHSO Admin.`
            });
        });
    });
};

// FORGOT PASSWORD — STEP 1: Check @umak.edu.ph domain & check if user is registered
const forgotPassword = (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ error: 'Please enter your @umak.edu.ph email address.' });
    }

    const cleanEmail = email.trim().toLowerCase();

    // 1. Enforce @umak.edu.ph domain check
    if (!cleanEmail.endsWith(UMAK_DOMAIN)) {
        return res.status(400).json({
            error: `Invalid email domain: Password reset is restricted to official ${UMAK_DOMAIN} accounts.`
        });
    }

    // 2. Check if email exists in database
    userModel.findByEmail(cleanEmail, async (err, results) => {
        if (err) return handleServerError(res, err, 'User lookup error.');
        if (results.length === 0) {
            // Anti-enumeration: Return generic success message without leaking account presence
            return res.json({
                message: `If this account exists for ${cleanEmail}, a 6-digit password reset OTP has been sent. Please check your inbox.`,
                email: cleanEmail
            });
        }

        const user = results[0];
        const resetOtp = generateVerificationCode();

        // Save OTP with 15-minute expiration
        userModel.setResetOtp(cleanEmail, encryptAES256(resetOtp), 15, async (updErr) => {
            if (updErr) return handleServerError(res, updErr, 'Failed to generate reset OTP.');

            const { sendPasswordResetEmail } = require('../services/emailService');
            try {
                await sendPasswordResetEmail(cleanEmail, user.name, resetOtp);
            } catch (mailErr) {
                console.error('[RESET EMAIL ERROR]', mailErr.message);
            }

            res.json({
                message: `A 6-digit password reset OTP code has been sent to ${cleanEmail}. Please check your email inbox.`,
                email: cleanEmail
            });
        });
    });
};

// FORGOT PASSWORD — STEP 2: Verify Reset OTP Code
const verifyResetOtp = (req, res) => {
    const { email, otp } = req.body;

    if (!email || !otp) {
        return res.status(400).json({ error: 'Email and 6-digit reset code are required.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanOtp = otp.trim();

    userModel.findByEmail(cleanEmail, (err, results) => {
        if (err) return handleServerError(res, err, 'OTP verification error.');
        if (results.length === 0) return res.status(404).json({ error: 'User account not found.' });

        const user = results[0];

        if (!user.reset_otp || decryptAES256(user.reset_otp) !== cleanOtp) {
            return res.status(400).json({ error: 'Invalid 6-digit reset code. Please check and try again.' });
        }

        if (user.reset_otp_expires && new Date(user.reset_otp_expires) < new Date()) {
            return res.status(400).json({ error: 'Reset code has expired. Please request a new one.' });
        }

        res.json({
            message: 'Reset code verified successfully. You can now set your new password.',
            email: cleanEmail,
            otp: cleanOtp
        });
    });
};

// FORGOT PASSWORD — STEP 3: Set New Password
const resetPassword = async (req, res) => {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
        return res.status(400).json({ error: 'Email, reset code, and new password are required.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanOtp = otp.trim();

    // Validate strong password policy
    const passwordErrors = validatePassword(newPassword);
    if (passwordErrors.length > 0) {
        return res.status(400).json({
            error: 'Password does not meet security requirements.',
            passwordErrors
        });
    }

    userModel.findByEmail(cleanEmail, async (err, results) => {
        if (err) return handleServerError(res, err, 'Reset password error.');
        if (results.length === 0) return res.status(404).json({ error: 'User account not found.' });

        if (!user.reset_otp || decryptAES256(user.reset_otp) !== cleanOtp) {
            return res.status(400).json({ error: 'Invalid or expired reset code.' });
        }

        if (user.reset_otp_expires && new Date(user.reset_otp_expires) < new Date()) {
            return res.status(400).json({ error: 'Reset code has expired. Please request a new one.' });
        }

        try {
            const hashedPassword = await bcrypt.hash(newPassword, 10);
            userModel.resetPassword(cleanEmail, hashedPassword, (updErr) => {
                if (updErr) return handleServerError(res, updErr, 'Failed to update password.');
                res.json({
                    message: 'Password reset successful! You can now log in with your new password.'
                });
            });
        } catch (hashErr) {
            res.status(500).json({ error: 'Password encryption failed.' });
        }
    });
};

// GOOGLE OAUTH 2.0 LOGIN CONTROLLER — WITH STRICT @umak.edu.ph CHECK
const googleLogin = async (req, res) => {
    const { token, idToken, user: rawUser } = req.body;

    let googleEmail = '';
    let googleName = '';

    try {
        const authToken = idToken || token;
        if (!authToken) {
            return res.status(400).json({ error: 'Google authentication token is required.' });
        }

        const { verifyGoogleToken } = require('../utils/googleAuth');
        const googleProfile = await verifyGoogleToken(authToken);

        if (!googleProfile || !googleProfile.email) {
            return res.status(401).json({ error: 'Failed to verify Google account profile.' });
        }

        googleEmail = googleProfile.email;
        googleName = googleProfile.name || (rawUser && rawUser.name) || '';

        const cleanEmail = googleEmail.trim().toLowerCase();

        // STRICT DOMAIN CHECK: Must end with @umak.edu.ph
        if (!cleanEmail.endsWith(UMAK_DOMAIN)) {
            return res.status(400).json({
                error: `Access Denied: Google Sign-In is strictly restricted to official ${UMAK_DOMAIN} accounts (e.g. k12345678@umak.edu.ph). Personal @gmail.com accounts are not allowed.`
            });
        }

        // Check if user exists in database
        userModel.findByEmail(cleanEmail, async (err, results) => {
            if (err) return handleServerError(res, err, 'Google login database error.');

            if (results.length > 0) {
                const user = results[0];

                // Lockout Check
                if (user.locked_until && new Date(user.locked_until) > new Date()) {
                    return res.status(423).json({
                        error: 'Account Temporarily Locked due to security policy. Please request an admin unlock.',
                        isLocked: true,
                        unlockRequested: !!user.unlock_requested
                    });
                }

                // If account exists but is not verified yet, send OTP code to email
                if (!user.is_verified) {
                    const verificationCode = generateVerificationCode();
                    userModel.updateVerificationCode(cleanEmail, encryptAES256(verificationCode), async () => {
                        try {
                            await sendVerificationEmail(cleanEmail, user.name, verificationCode);
                        } catch (mErr) {
                            console.error('[GOOGLE OTP EMAIL ERROR]', mErr.message);
                        }
                    });

                    return res.json({
                        requiresVerification: true,
                        email: cleanEmail,
                        message: `Account pending verification. A 6-digit verification code has been sent to ${cleanEmail}.`
                    });
                }

                // Reset failed attempts & issue JWT for verified user
                userModel.resetFailedAttempts(cleanEmail, () => { });

                logAudit({
                    req,
                    category: 'auth',
                    action: 'GOOGLE_LOGIN',
                    actor: { id: user.id, email: user.email, role: user.role },
                    description: 'Signed in via Google SSO'
                });

                const jwtToken = jwt.sign(
                    { id: user.id, name: user.name, email: user.email, role: user.role },
                    JWT_SECRET,
                    { expiresIn: '24h' }
                );

                return res.json({
                    message: `Welcome back to iPark UMAK, ${user.name}! (Signed in via Google)`,
                    token: jwtToken,
                    user: {
                        id: user.id,
                        name: user.name,
                        email: user.email,
                        role: user.role,
                        is_verified: user.is_verified
                    }
                });
            } else {
                // If user doesn't exist yet, check if password & role were provided for completing registration setup
                const { role: inputRole, password: inputPassword } = req.body;

                if (!inputPassword || !inputRole) {
                    return res.json({
                        requiresSetup: true,
                        email: cleanEmail,
                        name: googleName || cleanEmail.split('@')[0],
                        message: `Google Account (${cleanEmail}) verified! Please select your account classification (Student or Faculty) and set a password.`
                    });
                }

                // User provided password & role for new Google account setup
                const passwordErrors = validatePassword(inputPassword);
                if (passwordErrors.length > 0) {
                    return res.status(400).json({
                        error: 'Password does not meet security requirements.',
                        passwordErrors
                    });
                }

                const userRole = (inputRole && (inputRole.toLowerCase() === 'faculty' || inputRole.toLowerCase() === 'staff')) ? 'faculty' : 'student';
                const hashedPassword = await bcrypt.hash(inputPassword, 10);
                const verificationCode = generateVerificationCode();

                const newUserData = {
                    name: googleName || cleanEmail.split('@')[0],
                    email: cleanEmail,
                    password: hashedPassword,
                    role: userRole,
                    verification_code: encryptAES256(verificationCode),
                    is_verified: 0
                };

                userModel.createUser(newUserData, async (createErr, createRes) => {
                    if (createErr) return handleServerError(res, createErr, 'Failed to provision Google account.');

                    logAudit({
                        req,
                        category: 'auth',
                        action: 'REGISTER',
                        actor: { id: createRes ? createRes.insertId : null, email: cleanEmail, role: userRole },
                        description: `Registered new ${userRole} account via Google`
                    });

                    try {
                        await sendVerificationEmail(cleanEmail, newUserData.name, verificationCode);
                    } catch (mErr) {
                        console.error('[GOOGLE OTP EMAIL ERROR]', mErr.message);
                    }

                    return res.status(201).json({
                        requiresVerification: true,
                        email: cleanEmail,
                        message: `Official Heron Account created! A 6-digit verification code has been sent to ${cleanEmail}. Please check your inbox.`
                    });
                });
            }
        });
    } catch (authErr) {
        console.error('[GOOGLE LOGIN ERROR]', authErr.message);
        return res.status(400).json({
            error: 'Google authentication failed. Please sign in with your official @umak.edu.ph account.'
        });
    }
};

module.exports = {
    register,
    verifyCode,
    resendCode,
    login,
    getMe,
    requestUnlock,
    getAllUsersAdmin,
    adminUnlockUser,
    forgotPassword,
    verifyResetOtp,
    resetPassword,
    googleLogin
};
