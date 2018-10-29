'use strict';
const db = require('../secrets/config');
const pg = require('pg');
const pool = new pg.Pool(db.conn);

exports.getItems = (req, res, callback) => {
    const id_wishlist = req.params.id;

    const query = `
    SELECT DISTINCT ON 
	(subproducts.id) subproducts.id, users.id as user_id, products.name, subproducts.price, subproducts.size, images.location_aws
    FROM wishlist, subproducts, products, images, users
    WHERE wishlist.id = ($1)
	AND users.id = wishlist.id_user
	AND subproducts.id = wishlist.id_subproduct	
	AND subproducts.id = images.id_subproduct
	ORDER BY subproducts.id, user_id, products.name, subproducts.price, subproducts.size, images.location_aws
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
    const id_user = req.body[0].id_user;
    const id_subproduct = req.body[0].id_subproduct;
    
    // make query better
    const query = `
        INSERT INTO wishlist (id_user, id_subproduct) VALUES (($1), ($2))
    `;

    (async () => {
        const client = await pool.connect();

        try {
            const rows = await client.query(query, [id_cart, id_subproduct]);
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