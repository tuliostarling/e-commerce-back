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

exports.getTotalSoldByDate = (req, res, callback) => {

    //     -- dashboard info querys
    const queryFee = `
    SELECT SUM(transaction_fee) FROM purchases 
    WHERE created_at BETWEEN ($1) 
    AND ($2)`;


    const queryTotal = `
    SELECT SUM((sale -> 'amount' ->> 'total')::numeric) 
    FROM purchases WHERE created_at < $(1)
    `;

    const queryQuantity = `
    SELECT name, SUM(quantity) 
    FROM item_purchases
    GROUP BY name
    `;
};


exports.sendCode = (req, res, callback) => {
    const idUser = req.body.id_user;
    const idPurchase = req.body.id_purchase;
    const trackCode = req.body.trackCode;

    const queryUser = `
        SELECT email 
        FROM users 
        WHERE id = ($1);`;

    const queryPurchase = `
        UPDATE users
        SET tracking_code = ($1)
        status = 'Enviado'
        WHERE id = ($2);`;


    POOL.query(queryUser, [idUser]).then((result) => {
        mail.send({
            to: result.email,
            subject: 'Código de Rastramento do seu Produto!',
            html: `Olá ${result.email}, Segue o código de rastreio do correio para acompanhar a entrega do seu Produto!`
        }, (err) => {
            if (err) return callback(err, 500);

            POOL.query(queryPurchase, [trackCode, idPurchase]).then(result => {
                if (result.rowCount > 1) return callback(null, 200, { success: true });
            });
        });
    }).catch((err) => { return callback(err, 500); });

};
