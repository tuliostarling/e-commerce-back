'use strict';

const paypal = require('paypal-rest-sdk');
const config = require('../secrets/config');
const paymentData = require('../models/payment');



exports.payCart = (req, res, callback) => {
    let cartInfo = req.body;
    const id = req.body.idUser

    paypal.configure(config.paySandBox);
    let cartItems = [];

    cartInfo.cartItem.forEach(element => {

        element['sku'] = element.name
        element['currency'] = "BRL";
        element['quantity'] = element.qtd;
        delete element['id'];
        delete element['size'];
        delete element['id_item_cart'];
        delete element['location_aws'];
        delete element['qtd'];

        cartItems.push(element);
    });

    config.paymentObj.transactions[0].item_list.items = cartItems;
    config.paymentObj.transactions[0].amount.details.subtotal = cartInfo.subTotal.toString();
    config.paymentObj.transactions[0].amount.details.shipping = cartInfo.shipping.toString();
    config.paymentObj.transactions[0].amount.total = cartInfo.price.toString();

    paypal.payment.create(config.paymentObj, (err, payment) => {
        if (err) return console.log(err.response);
        for (let i = 0; i < payment.links.length; i++) {
            if (payment.links[i].rel === 'approval_url') {
                new paymentData({ id: id, cartValue: cartInfo.price.toString() })
                    .save((err, obj) => {
                        if (err) return callback(err, 500);
                        return callback(null, 200, { redirect: payment.links[i].href })
                    });
            }
        }
    });

};

exports.sucessPay = (req, res, callback) => {
    const payerID = req.body.payment.PayerID;
    const paymentId = req.body.payment.paymentId;
    paymentData.findOneAndUpdate({ id: req.body.user },
        { multi: false }, (err, result) => {
            if (err) return callback(err, 500);
            
            const cartValue = result.cartValue;
            const executePayment = {
                "payer_id": payerID,
                "transactions": [{
                    "amount": {
                        "currency": "BRL",
                        "total": cartValue
                    }
                }]
            }

            paypal.payment.execute(paymentId, executePayment, (err, result) => {
                if (err) console.log(err.response.details);
                else return callback(null, 200, result);
            });
            result.remove();

        });



};



