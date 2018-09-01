'use strict';

const db = require('../secrets/config');
const TABLE = 'category';

exports.getList = (req, res, callback) => {
    db.knex.select('*').from(TABLE).then(result => {
        if (result.length > 0)
            return callback(null, 200, result);

    }).catch((err) => { return callback(err, 500); });
};

exports.getOne = (req, res, callback) => {
    let cat = { category: req.body.category };
    db.knex.select('*').from(TABLE).where(cat).then(result => {
        if (result.length > 0)
            return callback(null, 200, result);
    }).catch((err) => { return callback(err, 500); });
};

exports.insertCategory = (req, res, callback) => {
    let newCat = { category: req.body.category, type: req.body.type };

    db.knex(TABLE).insert(newCat).then(result => {
        if (result.rowCount > 0)
            return callback('Categoria Inserida com sucesso!!', 200);
    }).catch((err) => { return callback(err, 500); });
};

exports.updateCategory = (req, res, callback) => {
    let id = { id: req.body.id };
    let newObj = { category: req.body.category, type: req.body.type };

    db.knex(TABLE).where(id).update(newObj).then(result => {
        if (result > 0) return callback('Categoria atualizada com sucesso.', 200);
    }).catch((err) => { return callback(err, 500); });

};

// implement cascade delete logic when the category has a relation with products.
exports.delete = (req, res, callback) => {
    let id = { id: req.params.id };

    db.knex(TABLE).where(id).del().then(result => {
        if (result > 0) return callback('Categoria deletada com sucesso.', 200);
    }).catch((err) => { return callback(err, 500); });
};





