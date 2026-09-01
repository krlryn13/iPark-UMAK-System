/**
 * Server Error Handling Utility
 * Securely logs internal technical errors (SQL, system, exceptions) to server console
 * while returning clean, user-friendly messages to the frontend.
 * Prevents raw database schema, query strings, or stack traces from leaking to clients.
 */

const handleServerError = (res, err, customMessage = 'A server error occurred. Please try again later.') => {
    // 1. Securely log technical details to backend server logs only
    console.error('[SERVER LOG - DETAILED ERROR]:', {
        message: err?.message || err,
        code: err?.code,
        sqlState: err?.sqlState,
        stack: err?.stack
    });

    // 2. Map common database errors to safe, friendly messages
    if (err && err.code) {
        switch (err.code) {
            case 'ER_DUP_ENTRY':
                return res.status(400).json({ 
                    error: 'A record with this information already exists in the system.' 
                });
            case 'ER_NO_REFERENCED_ROW':
            case 'ER_NO_REFERENCED_ROW_2':
                return res.status(400).json({ 
                    error: 'The requested reference or user account could not be found.' 
                });
            case 'ECONNREFUSED':
            case 'PROTOCOL_CONNECTION_LOST':
                return res.status(503).json({ 
                    error: 'Database connection temporarily unavailable. Please try again in a few moments.' 
                });
        }
    }

    // 3. Return sanitized, human-readable error response with error details
    return res.status(500).json({ 
        error: customMessage,
        details: err?.message || String(err)
    });
};

module.exports = { handleServerError };
