const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const userModel = require('../models/userModel');
const { sendVerificationEmail } = require('../services/emailService');

const UMAK_DOMAIN = '@umak.edu.ph';

// Helper to generate 6-digit verification code
const generateVerificationCode = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
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

    if (password.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    }

    // Check if email already registered
    userModel.findByEmail(cleanEmail, async (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        if (results.length > 0) {
            const existingUser = results[0];
            if (existingUser.is_verified === 1) {
                return res.status(400).json({ error: 'Email address is already registered. Please Sign In instead.' });
            } else {
                // User exists but not verified yet: resend new code
                const newCode = generateVerificationCode();
                userModel.updateVerificationCode(cleanEmail, newCode, async (updErr) => {
                    if (updErr) return res.status(500).json({ error: updErr.message });
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
                if (err) return res.status(500).json({ error: err.message });

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
        if (err) return res.status(500).json({ error: err.message });
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
            if (verErr) return res.status(500).json({ error: verErr.message });

            const userData = { id: user.id, name: user.name, email: user.email, role: user.role, is_verified: 1 };
            const token = jwt.sign(
                { id: user.id, email: user.email, role: user.role },
                process.env.JWT_SECRET || 'ipark_umak_secret_key',
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
        if (findErr) return res.status(500).json({ error: findErr.message });
        if (results.length === 0) return res.status(404).json({ error: 'User not found.' });

        const userName = results[0].name || 'Heron';

        userModel.updateVerificationCode(cleanEmail, newCode, async (err) => {
            if (err) return res.status(500).json({ error: err.message });
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

// LOGIN USER
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
        if (err) return res.status(500).json({ error: err.message });
        if (results.length === 0) {
            return res.status(401).json({ error: 'Account not found. Please Sign Up for a new Heron account.' });
        }

        const user = results[0];

        try {
            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                return res.status(401).json({ error: 'Incorrect password. Please try again.' });
            }

            // Check if user is verified
            if (user.is_verified === 0) {
                const newCode = user.verification_code || generateVerificationCode();
                if (!user.verification_code) {
                    userModel.updateVerificationCode(cleanEmail, newCode, () => {});
                }
                return res.status(403).json({ 
                    error: 'Your account is not verified yet. Please enter the 6-digit verification code.',
                    requiresVerification: true,
                    email: cleanEmail,
                    verificationCode: newCode
                });
            }

            const userData = { id: user.id, name: user.name, email: user.email, role: user.role, is_verified: 1 };
            const token = jwt.sign(
                { id: user.id, email: user.email, role: user.role },
                process.env.JWT_SECRET || 'ipark_umak_secret_key',
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

module.exports = { register, verifyCode, resendCode, login };
