'use strict';
const db = require('../secrets/config');
const pg = require('pg');
const pool = new pg.Pool(db.conn);


exports.getItems = (req, res, callback) => {
    const id_cart = req.params.id;

    const query = `
    SELECT DISTINCT subproducts.id, products.name, subproducts.price, subproducts.size, items.qtd, items.id as id_item, images.location_aws
    FROM items, cart, subproducts, products, images
    where cart.id = ($1)
    and subproducts.id = items.id_subproduct
	and subproducts.id_product = products.id
	and items.id_subproduct = images.id_subproduct limit 1
    `;

    (async () => {
        const client = await pool.connect();

        try {
            const { rows } = await client.query(query, [id_cart]);

            if (rows.length > 0) {
                let totalPrice = rows.map(x => x.price * x.amount)
                    .reduce((curr, next) => curr + next, 0);
                let pricesObj = {
                    finalValue: totalPrice
                };

                if (totalPrice >= 80) pricesObj.installments2x = totalPrice / 2;
                if (totalPrice >= 140) pricesObj.installments3x = totalPrice / 3;
                if (totalPrice >= 300) pricesObj.installments4x = totalPrice / 4;

                return callback(null, 200, [rows, pricesObj]);
            }
        } catch (err) {
            console.log(err);
            throw err;
        } finally {
            client.release();
        }

    })().catch(err => { return callback(err, 500); });
};


exports.addtoCart = (req, res, callback) => {
    const id_cart = req.body[0].id_cart;
    const id_subproduct = req.body[0].id_subproduct;
    const qtd = req.body[0].amount;

    const query = `
    INSERT INTO items(id_cart,id_subproduct,qtd) 
    SELECT ($1),($2),($3)
    WHERE NOT EXISTS (
    SELECT id_subproduct
    FROM items WHERE id_subproduct = ($2) AND id_cart = ($1)
    )`;

    (async () => {
        const client = await pool.connect();

        try {
            const rows = await client.query(query, [id_cart, id_subproduct, qtd]);
            if (rows.rowCount > 0) return callback(null, 200, rows);
            return callback('Produto já esta no carrinho', 401);
        } catch (err) {
            console.log(err);
            throw err;
        } finally {
            client.release();
        }

    })().catch(err => { return callback(err, 500); });

};

exports.increaseAmount = (req, res, callback) => {
    const amount = req.body[0].amount;
    const id_item = req.body[0].id_item;

    let query = `
    UPDATE items SET qtd = ($1)
    WHERE items.id = ($2)`;

    (async () => {
        const client = await pool.connect();

        try {
            const rows = await client.query(query, [amount, id_item]);
            if (rows.rowCount > 0) return callback(null, 200);
        } catch (err) {
            console.log(err);
            throw err;
        } finally {
            client.release();
        }

    })().catch(err => { return callback(err, 500); });
};


exports.removefromCart = (req, res, callback) => {
    const id_subproduct = req.params.id;

    const query = `DELETE FROM items WHERE id_subproduct = ($1);`;

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