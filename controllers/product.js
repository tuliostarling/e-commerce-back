'use strict';

const db = require('../secrets/config');
const pg = require('pg');
const pool = new pg.Pool(db.conn);
const TABLE = 'products';

exports.insertProduct = (req, res, callback) => {
    const array = req.files;
    const product = req.body;
    let query;

    if (product.defaultProduct >= 1) {
        query = `
        WITH insertProduct AS (
            INSERT INTO products(id_category,name,size,amount,price,discount,description,color)
            VALUES($1,$2,$3,$4,$5,$6,$7,$8)
            ON   CONFLICT DO NOTHING
            RETURNING id as product_id
        )
        INSERT INTO subproducts(id_product,name,size,amount,price,discount,description,color)
        VALUES((select product_id from insertProduct),$2,$3,$4,$5,$6,$7,$8)
        RETURNING id as product_id
        `;

    } else {
        query = `INSERT INTO subproducts(id_product,name,size,amount,price,discount,description,color)
        VALUES($1,$2,$3,$4,$5,$6,$7,$8)
        RETURNING id as product_id`;
    }

    const images = array.reduce((prev, curr) => {
        return {
            name: [...prev.name, curr.originalname],
            type: [...prev.type, curr.mimetype],
            buffer: [...prev.buffer, curr.buffer]
        }
    }, { name: [], type: [], buffer: [] });

    (async () => {
        const client = await pool.connect();

        try {
            await client.query('BEGIN');
            const { rows } = await client.query(query,
                [product.id_fk, product.name, product.size, product.amount, product.price,
                product.discount, product.description, product.color]);

            const imageQuery = `INSERT into images(id_subproduct,image_type,image_name,image)
                VALUES($1,$2,$3,$4)`;

            for (let i = 0; i < images.name.length; i++) {
                await client.query(imageQuery, [rows[0].product_id, images.type[i], images.name[i], images.buffer[i]]);
            }
            await client.query('COMMIT');
            return callback(null, 200, 'Produto e imagens cadastros com sucesso.');
        } catch (err) {
            await client.query('ROLLBACK');
            console.log(err);
            throw err;
        } finally {
            client.release();
        }
    })().catch(err => { return callback(err, 500); });

};


exports.getList = (req, res, callback) => {
    const id = req.body.id;

    let query =
        `select subproducts.id ,subproducts.name , subproducts.id, subproducts.price, images.image_type, images.image_name, images.image, images.id as id_image
	    from products , subproducts , images 
		where products.id = subproducts.id_product 
        and images.id_subproduct = subproducts.id and id_category = ($1)
        `;

    (async () => {
        const client = await pool.connect();

        try {
            const { rows } = await client.query(query, [id]);
            //console.log(rows);
            if (rows > 0) return callback(null, 200, rows);

        } catch (err) {
            console.log(err);
            throw err;
        } finally {
            client.release();
        }

    })().catch(err => { return callback(err, 500); });

};


exports.getOne = (req, res, callback) => {
    const id = req.body.id;

    let query =
        `select * from subproducts, images 
	        where images.id_subproduct = subproducts.id
		    and subproducts.id = ($1) 
        `;

    (async () => {
        const client = await pool.connect();

        try {
            const { rows } = await client.query(query, [id]);
            //console.log(rows);
            if (rows > 0) return callback(null, 200, rows);

        } catch (err) {
            console.log(err);
            throw err;
        } finally {
            client.release();
        }


    })().catch(err => { return callback(err, null); });



};



