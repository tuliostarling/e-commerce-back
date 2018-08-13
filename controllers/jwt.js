'use strict';
const jwt = require('jsonwebtoken');

module.exports = function generateToken(secret, params) {
    return jwt.sign(params, secret, {
        expiresIn: 86400
    });
};