'use strict';

const paypal = require('paypal-rest-sdk');
const config = require('../secrets/config');
const paymentData = require('../models/payment');
const DB = require('../wrappers/db');
const POOL = DB.getPool();
const pg = require('pg');
const pool = new pg.Pool(config.conn);

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
    config.paymentObj.transactions[0].item_list.shipping_address.recipient_name = "Teste"
    config.paymentObj.transactions[0].item_list.shipping_address.country_code = "BR"
    config.paymentObj.transactions[0].item_list.shipping_address.line1 = cartInfo.adress.street
    config.paymentObj.transactions[0].item_list.shipping_address.line2 = cartInfo.adress.neighborhood
    config.paymentObj.transactions[0].item_list.shipping_address.city = cartInfo.adress.city
    config.paymentObj.transactions[0].item_list.shipping_address.postal_code = cartInfo.adress.cep
    config.paymentObj.transactions[0].item_list.shipping_address.state = cartInfo.adress.state
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
    const idUser = req.body.user;
    const idCart = req.body.cart;

    paymentData.findOneAndUpdate({ id: req.body.user },
        { multi: false }, (err, data) => {
            if (err) return callback(err, 500);

            const cartValue = data.cartValue;
            config.executePaymentObj.payer_id = payerID;
            config.executePaymentObj.transactions[0].amount.total = cartValue;

            const insertQuery = `
                INSERT INTO purchases(id_user, adress, sale, transaction_fee, status, tracking_code)
                VALUES ($1,$2,$3,$4,$5,$6)
                RETURNING id AS purchase_id;
                ;`;

            const insertQueryItem = `
                INSERT INTO item_purchases(id_purchase, quantity, name, price, currency)
                VALUES ($1, $2, $3, $4, $5);
                `;

            const deleteQueryCart = `
                DELETE FROM items where id_cart = ($1);
                `;

            paypal.payment.execute(paymentId, config.executePaymentObj, (err, result) => {
                if (err) return console.log(err.response.details);
                let arr = result.transactions[0].item_list.items;

                (async () => {
                    const client = await pool.connect();

                    try {
                        const { rows } = await client.query(insertQuery, [idUser,
                            result.payer.payer_info.shipping_address,
                            result.transactions[0].related_resources[0].sale,
                            result.transactions[0].related_resources[0].sale.transaction_fee.value, 'Aguardando', false]);

                        for (let i = 0; i < arr.length; i++) {
                            await client.query(insertQueryItem,
                                [rows[0].purchase_id, arr[i].quantity,
                                arr[i].name, arr[i].price, arr[i].currency])

                        }
                        const cleanCart = await client.query(deleteQueryCart, [idCart]);

                        if (cleanCart.rowCount > 0) {
                            data.remove();
                            return callback(null, 200, result)
                        }
                    } catch (err) {
                        console.log(err);
                        throw err;
                    } finally {
                        client.release();
                    }

                })().catch(err => { return callback(err, 500); });
            });
        });
};



