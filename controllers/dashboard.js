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



};
