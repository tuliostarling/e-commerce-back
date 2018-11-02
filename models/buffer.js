'use strict';

const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const bufferSchema = new Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, validade: [validateEmail, 'Padrão de email inválido'] },
    password: { type: String, required: true, validade: [validatePassword, 'Tamanho de Senha inválido'] },
    admin: { type: Boolean, required: true },
    hashed: { type: String, required: true },
    createdAt: { type: Date }
});

function validateEmail(email) {
    var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(email);
};

function validatePassword(password) {
    return password.lenght > 6 && password.lenght < 30;
};

bufferSchema.index({ createdAt: 1 }, { expireAfterSeconds: 3600 })

module.exports = mongoose.model('bufferinfo', bufferSchema);