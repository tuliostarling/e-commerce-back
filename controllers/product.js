'use strict';

const db = require('../secrets/config');
const pg = require('pg');
const pool = new pg.Pool(db.conn);
const AWS = require('aws-sdk');

exports.addImages = (req, res, callback) => {
    const images = req.files;
    const id = req.params.id;

    (async () => {
        const client = await pool.connect();

        try {
            const imageQuery = `INSERT into images(id_subproduct,versionID_aws,location_aws,bucket_aws,key_aws,etag_aws)
                VALUES($1,$2,$3,$4,$5,$6)`;

            const s3Result = await s3BucketInsert(images);

            for (let i = 0; i < s3Result.length; i++) {
                await client.query(imageQuery,
                    [id, s3Result[i].VersionId, s3Result[i].Location, s3Result[i].Bucket, s3Result[i].Key, s3Result[i].ETag]);
            }

            return callback(null, 200, 'Produto e imagens cadastros com sucesso.');
        } catch (err) {
            await client.query('ROLLBACK');
            console.log(err);
            throw err;
        } finally {
            client.release();
        }
    })().catch(err => { return callback(err, 500); });

    function s3BucketInsert(images) {
        AWS.config.update({ accessKeyId: db.S3.KEY, secretAccessKey: db.S3.SECRET });
        const s3Bucket = new AWS.S3();
        const results = [];
        return new Promise(
            (resolve, reject) => {
                images.map((item) => {
                    let params = {
                        Bucket: db.S3.BUCKET_PATH,
                        Key: item.originalname,
                        Body: item.buffer,
                        ContentType: item.mimetype,
                        ACL: 'public-read'
                    };

                    return s3Bucket.upload(params, (err, result) => {
                        if (err) return reject(err);
                        results.push(result);
                        if (results.length == images.length) return resolve(results);

                    });
                });
            });
    }

};

exports.insertProduct = (req, res, callback) => {
    const product = req.body;
    let query;

    if (product.defaultProduct) {
        query = `
        WITH insertProduct AS (
            INSERT INTO products(id_category,name,size,amount,price,discount,description,color)
            VALUES($1,$2,$3,$4,$5,$6,$7,$8)
            ON   CONFLICT DO NOTHING
            RETURNING id as product_id
        )
        INSERT INTO subproducts(id_product,name,size,amount,price,discount,description,color)
        VALUES((select product_id from insertProduct),$2,$3,$4,$5,$6,$7,$8)
        RETURNING id as product_id;
        `;

    } else {
        query = `INSERT INTO subproducts(id_product,name,size,amount,price,discount,description,color)
        VALUES($1,$2,$3,$4,$5,$6,$7,$8)
        RETURNING id as product_id;`;
    }

    (async () => {
        const client = await pool.connect();

        try {
            const { rows } = await client.query(query,
                [product.id_fk, product.name, product.size, product.amount, product.price,
                product.discount, product.description, product.color]);

            if (rows.length > 0) return callback(null, 200, rows.product_id);
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

    const query =
        `SELECT DISTINCT ON (images.id_subproduct) subproducts.id as id_subproduct ,subproducts.name, subproducts.id_product, subproducts.price, images.location_aws, images.id 
	    FROM products , subproducts , images 
		WHERE products.id = subproducts.id_product 
        AND images.id_subproduct = subproducts.id 
        AND id_category = ($1);
        `;

    (async () => {
        const client = await pool.connect();

        try {
            const { rows } = await client.query(query, [id]);
            console.log(rows);
            if (rows.length > 0) return callback(null, 200, rows);

        } catch (err) {
            console.log(err);
            throw err;
        } finally {
            client.release();
        }

    })().catch(err => { return callback(err, 500); });

};


exports.getOne = (req, res, callback) => {
    const id = req.params.id;

    const query =
        `select subproducts.id as id_subproduct, subproducts.name, subproducts.size, subproducts.amount, subproducts.price,
             subproducts.discount , subproducts.description, subproducts.color, subproducts.id_product,
                images.id, images.location_aws
	                from subproducts , images
    	                where subproducts.id = ($1);
        `;

    (async () => {
        const client = await pool.connect();

        try {
            const { rows } = await client.query(query, [id]);

            let imagesURL = rows.map(x => x.location_aws);
            let productObj = {
                id: rows[0].id_subproduct,
                name: rows[0].name,
                size: rows[0].size,
                amount: rows[0].amount,
                price: rows[0].price,
                discount: rows[0].discount,
                description: rows[0].description,
                color: rows[0].color,
                id_product: rows[0].id_product,
                location_aws: imagesURL
            };

            if (rows.length > 0) return callback(null, 200, productObj);

        } catch (err) {
            console.log(err);
            throw err;
        } finally {
            client.release();
        }

    })().catch(err => { return callback(err, null); });
};




