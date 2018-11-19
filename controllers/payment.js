'use strict';

const paypal = require('paypal-rest-sdk');
const config = require('../secrets/config');

exports.payCart = (req, res, callback) => {
    let cartInfo = req.body;

    paypal.configure(config.paySandBox);

    let paymentObj = {
        "intent": "sale",
        "payer": {
            "payment_method": "paypal"
        },
        "redirect_urls": {
            "return_url": "http://return.url",
            "cancel_url": "http://cancel.url"
        },
        "transactions": [{
            "item_list": {
                "items": [{
                    "name": "item",
                    "sku": "item",
                    "price": "1.00",
                    "currency": "USD",
                    "quantity": 1
                }]
            },
            "amount": {
                "currency": "USD",
                "total": "1.00"
            },
            "description": "This is the payment description."
        }]
    };

    paypal.payment.create(paymentObj, (err, payment) => {
        if (err) console.log(err);
        else console.log(payment);
    });

};
