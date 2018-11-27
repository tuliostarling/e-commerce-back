'use strict';

const DB = require('../wrappers/db');
const POOL = DB.getPool();
const mail = require('../wrappers/mail');



exports.getPurchases = (req, res, callback) => {
    const query = `
        select * from purchases ORDER by created_at DESC
        `;

    POOL.query(query).then(result => {
        console.log(result.rows);


        //if (result.rows.length > 0) return callback(null, 200, result.rows);
    }).catch(err => { return callback(err, 500); })
};

exports.getTotalSoldThisMonth


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
