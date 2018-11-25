'use strict';

const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const PaymentSchema = new Schema({
    id: { type: String, required: true },
    cartValue: { type: String, required: true},
    createdAt: { type: Date }
});

module.exports = mongoose.model('paymentinfo', PaymentSchema);