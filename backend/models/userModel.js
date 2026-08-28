const db = require('../config/db');

const findByEmail = (email, callback) => {
    db.query('SELECT * FROM users WHERE email = ?', [email], callback);
};

const createUser = (userData, callback) => {
    const { name, email, password, role = 'student', verification_code, is_verified = 0 } = userData;
    db.query(
        'INSERT INTO users (name, email, password, role, verification_code, is_verified) VALUES (?, ?, ?, ?, ?, ?)',
        [name, email, password, role, verification_code, is_verified],
        callback
    );
};

const verifyUserCode = (email, code, callback) => {
    db.query(
        'UPDATE users SET is_verified = 1, verification_code = NULL WHERE email = ? AND verification_code = ?',
        [email, code],
        callback
    );
};

const updateVerificationCode = (email, code, callback) => {
    db.query(
        'UPDATE users SET verification_code = ? WHERE email = ?',
        [code, email],
        callback
    );
};

const findById = (id, callback) => {
    db.query('SELECT id, name, email, role, is_verified, created_at FROM users WHERE id = ?', [id], callback);
};

const incrementFailedAttempts = (email, callback) => {
    db.query(
        'UPDATE users SET failed_login_attempts = failed_login_attempts + 1 WHERE email = ?',
        [email],
        callback
    );
};

const resetFailedAttempts = (email, callback) => {
    db.query(
        'UPDATE users SET failed_login_attempts = 0, locked_until = NULL WHERE email = ?',
        [email],
        callback
    );
};

const lockAccount = (email, lockMinutes, callback) => {
    db.query(
        'UPDATE users SET locked_until = DATE_ADD(NOW(), INTERVAL ? MINUTE), failed_login_attempts = 0 WHERE email = ?',
        [lockMinutes, email],
        callback
    );
};

const requestUnlock = (email, callback) => {
    db.query(
        'UPDATE users SET unlock_requested = 1, unlock_requested_at = NOW() WHERE email = ?',
        [email],
        callback
    );
};

const getAllUsersAdmin = (callback) => {
    db.query(
        'SELECT id, name, email, role, is_verified, failed_login_attempts, locked_until, unlock_requested, unlock_requested_at, created_at FROM users ORDER BY created_at DESC',
        callback
    );
};

const adminUnlockUser = (userId, callback) => {
    db.query(
        'UPDATE users SET locked_until = NULL, failed_login_attempts = 0, unlock_requested = 0, unlock_requested_at = NULL WHERE id = ?',
        [userId],
        callback
    );
};

const setResetOtp = (email, otp, expiresMinutes, callback) => {
    db.query(
        'UPDATE users SET reset_otp = ?, reset_otp_expires = DATE_ADD(NOW(), INTERVAL ? MINUTE) WHERE email = ?',
        [otp, expiresMinutes, email],
        callback
    );
};

const resetPassword = (email, newHashedPassword, callback) => {
    db.query(
        'UPDATE users SET password = ?, reset_otp = NULL, reset_otp_expires = NULL, locked_until = NULL, failed_login_attempts = 0 WHERE email = ?',
        [newHashedPassword, email],
        callback
    );
};

module.exports = {
    findByEmail, createUser, verifyUserCode, updateVerificationCode, findById,
    incrementFailedAttempts, resetFailedAttempts, lockAccount,
    requestUnlock, getAllUsersAdmin, adminUnlockUser,
    setResetOtp, resetPassword
};
