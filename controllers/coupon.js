'use strict';
const db = require('../secrets/config');
const TABLE = 'coupons';

exports.addCoupon = (req, res, callback) => {

    let coupon = req.body;
    db.knex(TABLE).where({ name: req.body.name }).then(result => {
        if (result.length > 0) return callback('Coupon com mesmo nome ja existente', 404);

        db.knex(TABLE).insert(coupon).then(result => {
            if (result.rowCount > 0) return callback(null, 200, 'Coupon inserido com sucesso');
        });

    }).catch((err) => { return callback(err, 500); });
};

exports.getCoupon = (req, res, callback) => {

    let id = { id: req.body.id };
    db.knex.select('*').from(TABLE).where(id).then(result => {
        if (result.length > 0)
            return callback(null, 200, result);
        return callback('Coupon não encontrado', 404);
    }).catch((err) => { return callback(err, 500); });
};


exports.getAllCoupon = (req, res, callback) => {

    db.knex.select('*').from(TABLE).then(result => {
        if (result.length > 0)
            return callback(null, 200, result);
    }).catch((err) => { return callback(err, 500); });
};


exports.updateCoupon = (req, res, callback) => {
    let id = { id: req.body.id };
    let newObj = req.body;

    db.knex(TABLE).where(id).update(newObj).then(result => {
        if (result > 0) return callback(null, 200, 'Coupon Atualizo com sucesso.');
    }).catch((err) => { return callback(err, 500); });

};


exports.delCoupon = (req, res, callback) => {
    let id = { id: req.params.id };

    db.knex(TABLE).where(id).del().then(result => {
        if (result > 0) return callback(null, 200, 'Coupon Deletado com sucesso.');
    }).catch((err) => { return callback(err, 500); });
};