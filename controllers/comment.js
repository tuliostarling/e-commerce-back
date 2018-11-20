'use strict';

const db = require('../wrappers/db');
const pool = db.getPool();

exports.addComment = (req, res, callback) => {
    const commentObj = req.body;
    const query = `
    INSERT INTO product_comment(id_user,id_subproduct,comment,rating)
    VALUES (($1),($2),($3),($4))`;

    pool.query(query,
        [commentObj.id_user, commentObj.id_subproduct, commentObj.comment, commentObj.rating])
        .then((result) => {
            if (result.rowCount > 0) return callback(null, 200, { sucess: true });
        }).catch((err) => { return callback(err, 500); });
};

exports.getComment = (req, res, callback) => {
    const idSubproduct = req.params.id;
    const query = `    
    SELECT u.name , cp.id_user , cp.id_subproduct, cp.comment, cp.rating , cp.created_at
    FROM product_comment cp , users u
    WHERE cp.id_subproduct = ($1)
    AND u.id = cp.id_user`;

    const totalQuery = `SELECT COUNT(*) FROM product_comment WHERE id_subproduct = ($1)`;

    const avgRating = `SELECT AVG(rating) FROM product_comment where id_subproduct = ($1)`;

    (async () => {
        const client = await pool.connect();

        try {
            const total = await client.query(totalQuery, [idSubproduct]);
            const { rows } = await client.query(query, [idSubproduct]);
            const avg = await client.query(avgRating, [idSubproduct]);
            
            if (rows.length >= 0) return callback(null, 200, { rows: rows, total: total.rows, avgRating: avg.rows });
        } catch (err) {
            console.log(err);
            throw err;
        } finally {
            client.release();
        }

    })().catch(err => { return callback(err, 500); });
};