'use strict';

const DB = require('../wrappers/db');
const POOL = DB.getPool();
const mail = require('../wrappers/mail');

exports.getPurchases = (req, res, callback) => {
    const page = req.params.page;

    const query = `
        SELECT * FROM purchases 
        ORDER by created_at DESC LIMIT 15 OFFSET ($1);
        `;

    POOL.query(query, [page]).then(result => {
        if (result.rows.length > 0) return callback(null, 200, result.rows);
    }).catch(err => { return callback(err, 500); })
};

exports.getFee = (req, res, callback) => {
    const dateInitial = req.body.initialDate;
    const datedateEnd = req.body.finalDate;

    const queryFee = `
        SELECT SUM(transaction_fee) FROM purchases 
        WHERE created_at BETWEEN ($1) 
        AND ($2)`;

    POOL.query(queryFee, [dateInitial, datedateEnd]).then(result => {
        if (result.rows.length > 0) return callback(null, 200, result.rows);
    }).catch(err => { return callback(err, 500); })
};

exports.getTotalProfit = (req, res, callback) => {
    const date = req.body.date;

    const queryTotal = `
    SELECT SUM((sale -> 'amount' ->> 'total')::numeric) 
    FROM purchases WHERE created_at < ($1)
    `;

    POOL.query(queryTotal, [date]).then(result => {
        if (result.rows.length > 0) return callback(null, 200, result.rows);
    }).catch(err => { return callback(err, 500); })
};

exports.getTotalSoldByDate = (req, res, callback) => {
    const dateInitial = req.body.initialDate;
    const datedateEnd = req.body.finalDate;

    const queryQuantity = `
        SELECT name, SUM(quantity) 
        FROM item_purchases
        WHERE created_at BETWEEN ($1) 
        AND ($2) GROUP BY name
    `;

    POOL.query(queryQuantity, [dateInitial, datedateEnd]).then(result => {
        if (result.rows.length >= 0) return callback(null, 200, result.rows);
    }).catch(err => { return callback(err, 500); })
};


exports.sendCode = (req, res, callback) => {
    const idUser = req.body.id_user;
    const idPurchase = req.body.id_purchase;
    const deliveryStatus = req.body.status;
    const trackCode = req.body.tracking_code;
    
    const queryUser = `
        SELECT * 
        FROM users 
        WHERE id = ($1);`;

    const queryPurchase = `
        UPDATE purchases
        SET tracking_code = ($1),
        status = ($2)
        WHERE id = ($3);`;


    POOL.query(queryUser, [idUser]).then((result) => {
        mail.send({
            to: result.rows[0].email,
            subject: 'Código de Rastramento do seu Produto!',
            html: `Olá ${result.rows[0].name}, Segue o código de rastreio (${trackCode}) do correio para acompanhar a entrega do seu produto!`
        }, (err) => {
            if (err) return callback(err, 500);

            POOL.query(queryPurchase, [trackCode, deliveryStatus, idPurchase]).then(result => {
                if (result.rowCount > 1) return callback(null, 200, { success: true });
            });
        });
    }).catch((err) => { return callback(err, 500); });
};
