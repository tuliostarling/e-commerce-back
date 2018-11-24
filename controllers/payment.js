'use strict';

const paypal = require('paypal-rest-sdk');
const config = require('../secrets/config');

exports.payCart = (req, res, callback) => {
    let cartInfo = req.body;

    paypal.configure(config.paySandBox);
    console.log(cartInfo);
    
    //let cartItems = cartInfo.cartItem.map()

    config.paymentObj.transactions[0].item_list.items;
    config.paymentObj.transactions[0].amount.total = cartInfo.price;

    // "items": [{
    //     "name": `${cartInfo.name}`,
    //     "sku": `${cartInfo.name}`,
    //     "price": `${cartInfo.skuPrice}`,
    //     "currency": "BRL",
    //     "quantity": cartInfo.quantity
    // }]

    // paypal.payment.create(config.paymentObj, (err, payment) => {
    //     if (err) return console.log(err.response);
    //     console.log(payment);
    //     for (let i = 0; i < payment.links.length; i++) {
    //         if (payment.links[i].rel === 'approval_url') return callback(null, 200, { redirect: payment.links[i].href })
    //     }

    // });

};


exports.sucessPay = (req, res, callback) => {

};
