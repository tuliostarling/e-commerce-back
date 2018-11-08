'use strict';
const db = require('../secrets/config');
const pg = require('pg');
const pool = new pg.Pool(db.conn);
const TABLE = 'coupons';

exports.addCoupon = (req, res, callback) => {

    let coupon = {
        name: req.body.name.toLowerCase(),
        value: req.body.value,
        valid: req.body.valid,
        expire_at: req.body.expire_at
    }

    db.knex(TABLE).where({ name: coupon.name }).then(result => {
        if (result.length > 0) return callback('Coupon com mesmo nome ja existente', 404);

        db.knex(TABLE).insert(coupon).then(result => {
            if (result.rowCount > 0) return callback(null, 200, result);
        });

    }).catch((err) => { return callback(err, 500); });
};

exports.getCoupon = (req, res, callback) => {

    let id = { id: req.params.id };
    db.knex.select('*').from(TABLE).where(id).then(result => {
        if (result.length > 0)
            return callback(null, 200, result);
        return callback('Coupon não encontrado', 404);
    }).catch((err) => { return callback(err, 500); });
};

exports.getAllCoupon = (req, res, callback) => {
    const offset = req.params.page * 16;

    const query =
        `SELECT * FROM coupons LIMIT 10 OFFSET ($1)`;

    (async () => {
        const client = await pool.connect();

        try {
            const total = await client.query(`SELECT count(*) from coupons`);
            const { rows } = await client.query(query, [offset]);

            if (rows.length > 0) return callback(null, 200, { total: total.rows, rows });
        } catch (err) {
            console.log(err);
            throw err;
        } finally {
            client.release();
        }

    })().catch(err => { return callback(err, 500); });
};

exports.updateCoupon = (req, res, callback) => {
    let id = { id: req.body.id };
    let newObj = req.body;

    db.knex(TABLE).where(id).update(newObj).then(result => {
        if (result > 0) return callback(null, 200, result);
    }).catch((err) => { return callback(err, 500); });

};

exports.delCoupon = (req, res, callback) => {
    let id = { id: req.params.id };

    db.knex(TABLE).where(id).del().then(result => {
        if (result > 0) return callback(null, 200, result);
    }).catch((err) => { return callback(err, 500); });
};