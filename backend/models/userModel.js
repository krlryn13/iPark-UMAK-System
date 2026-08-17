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

module.exports = { findByEmail, createUser, verifyUserCode, updateVerificationCode, findById };
