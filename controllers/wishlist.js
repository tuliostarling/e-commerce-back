'use strict';
const db = require('../secrets/config');
const pg = require('pg');
const pool = new pg.Pool(db.conn);

exports.getItems = (req, res, callback) => {
    const id_wishlist = req.params.id;

    const query = `
    SELECT DISTINCT ON 
	(subproducts.id) subproducts.id, products.name, subproducts.price, subproducts.size, wishlist_item.id as id_item, images.location_aws
    FROM wishlist_item, wishlist, subproducts, products, images
    WHERE wishlist.id = ($1)
	AND subproducts.id = wishlist_item.id_subproduct
	AND subproducts.id = images.id_subproduct
	ORDER BY subproducts.id, products.name, subproducts.price, subproducts.size, id_item, images.location_aws
	`;

    (async () => {
        const client = await pool.connect();

        try {
            const { rows } = await client.query(query, [id_wishlist]);

            return callback(null, 200, rows);
        } catch (err) {
            console.log(err);
            throw err;
        } finally {
            client.release();
        }

    })().catch(err => { return callback(err, 500); });
};

exports.addtoWishList = (req, res, callback) => {
    const id_wishlist = req.body[0].id_wishlist;
    const id_subproduct = req.body[0].id_subproduct;

    const query = `
    INSERT INTO wishlist_item(id_wishlist, id_subproduct) 
    SELECT ($1), ($2)
    WHERE NOT EXISTS (
    SELECT id_subproduct
    FROM wishlist_item WHERE id_subproduct = ($2) AND id_wishlist = ($1))
    `;

    (async () => {
        const client = await pool.connect();

        try {
            const rows = await client.query(query, [id_wishlist, id_subproduct]);
            if (rows.rowCount > 0) return callback(null, 200, rows);
            return callback('Produto já esta nos seus favoritos', 401);
        } catch (err) {
            console.log(err);
            throw err;
        } finally {
            client.release();
        }

    })().catch(err => { return callback(err, 500); });
};

exports.removefromWishList = (req, res, callback) => {
    const id_subproduct = req.params.id;

    const query = `DELETE FROM wishlist_item WHERE id_subproduct = ($1);`;

    (async () => {
        const client = await pool.connect();

        try {
            const rows = await client.query(query, [id_subproduct]);
            if (rows.rowCount > 0) return callback(null, 200, rows);
        } catch (err) {
            console.log(err);
            throw err;
        } finally {
            client.release();
        }

    })().catch(err => { return callback(err, 500); });
};