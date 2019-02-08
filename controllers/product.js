'use strict';

const db = require('../secrets/config');
const pg = require('pg');
const pool = new pg.Pool(db.conn);
const AWS = require('aws-sdk');


exports.getAllPromotions = (req, res, callback) => {
    const offset = req.params.page * 16;

    let query = `SELECT DISTINCT ON (images.id_subproduct) subproducts.id as id_subproduct ,products.name, subproducts.id_product, subproducts.price, images.location_aws 
    FROM products , subproducts , images
    WHERE products.id = subproducts.id_product 
	AND subproducts.promotion = true
    AND images.id_subproduct = subproducts.id
	AND subproducts.id NOT IN(SELECT id_subproduct FROM home_products) 
    LIMIT 16 OFFSET ($1)`;

    (async () => {
        const client = await pool.connect();

        try {
            const total = await client.query(`SELECT count(*) from subproducts where promotion = true`);
            const { rows } = await client.query(query, [offset]);

            if (rows.length > 0) return callback(null, 200, { total: total.rows, rows });
            return callback('Sem produtos em Promoção', 401)
        } catch (err) {
            console.log(err);
            throw err;
        } finally {
            client.release();
        }

    })().catch(err => { return callback(err, null); });
};

exports.getListMainProduct = (req, res, callback) => {
    const offset = req.params.page * 10;
    
    const query = `SELECT * from products LIMIT 10 OFFSET ($1)`;

    (async () => {
        const client = await pool.connect();

        try {
            const total = await client.query(`SELECT count(*) from products`);
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

exports.getAllSubProduct = (req, res, callback) => {
    const id = req.params.id;
    const offset = req.params.page * 8;

    const query = `SELECT subproducts.id,
                          subproducts.size,
                          subproducts.amount,
                          subproducts.price,
                          subproducts.old_price,
                          subproducts.promotion,
                          subproducts.discount,
                          subproducts.color,
                          subproducts.material,
                          subproducts.id_product
                    FROM subproducts
                    WHERE id_product = ($1)
                    ORDER BY subproducts.id ASC LIMIT 8 OFFSET ($2);`;

    const imgQuery = ` select json_agg(json_build_object('url',images.location_aws,'key',images.key_aws,'id',images.id)) as images
                        FROM subproducts, images
                        WHERE id_product = ($1)
                        AND images.id_subproduct = subproducts.id
                        GROUP BY subproducts.id
                        ORDER BY subproducts.id ASC;`;

    const totalQuery = `SELECT count(*) from subproducts where id_product = ($1)`;

    (async () => {
        const client = await pool.connect();

        try {
            const total = await client.query(totalQuery, [id]);
            const { rows } = await client.query(query, [id, offset]);
            const imgRows = await client.query(imgQuery, [id]);
            
            // rows.reduce((acc, row) => {
            //     const found = acc.find(r => r.id === row.id);
            //     if (found) {
            //         found.urls.push(row.location_aws);
            //     } else {
            //         row.urls = [row.location_aws];
            //         delete row.location_aws;
            //         acc.push(row);
            //     }
            //     return acc;
            // }, []);

            if (rows.length >= 0) return callback(null, 200, { rows: rows, images: imgRows.rows, total: total.rows });
        } catch (err) {
            console.log(err);
            throw err;
        } finally {
            client.release();
        }

    })().catch(err => { return callback(err, 500); });
}

exports.getListByCategory = (req, res, callback) => {
    const id = req.params.id;
    const offset = req.params.page * 16;

    const query =
        `SELECT DISTINCT ON (images.id_subproduct) subproducts.id,products.name, subproducts.id_product, subproducts.price,
        images.location_aws, images.id as id_image
	    FROM products , subproducts , images
        WHERE products.id_category = ($1)
        AND products.id = subproducts.id_product
        AND images.id_subproduct = subproducts.id 
        LIMIT 16 OFFSET ($2)
        `;

    const totalQuery = `select count(*) from subproducts, products where subproducts.id_product = products.id
	                        and products.id_category = ($1)`;

    (async () => {
        const client = await pool.connect();

        try {
            const total = await client.query(totalQuery, [id]);
            const { rows } = await client.query(query, [id, offset]);

            if (rows.length > 0) return callback(null, 200, { rows, total: total.rows });
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
        `SELECT subproducts.id, subproducts.size, subproducts.amount, subproducts.price, subproducts.old_price,
            subproducts.promotion,subproducts.discount, subproducts.color, subproducts.id_product, products.name, products.description,
            products.model, products.type, images.id, images.location_aws
	                FROM products, subproducts, images 
                        WHERE subproducts.id = ($1)
                        AND products.id = subproducts.id_product
                        AND images.id_subproduct = subproducts.id;
        `;

    (async () => {
        const client = await pool.connect();

        try {
            const { rows } = await client.query(query, [id]);
            let imagesURL = rows.map(x => x.location_aws);
            let productObj = {
                id: rows[0].id,
                name: rows[0].name,
                size: rows[0].size,
                amount: rows[0].amount,
                price: rows[0].price,
                old_price: rows[0].old_price,
                promotion: rows[0].promotion,
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

exports.getOneMain = (req, res, callback) => {
    const id = req.params.id;

    let query = `SELECT * from products WHERE id = ($1)`;

    (async () => {
        const client = await pool.connect();

        try {
            const { rows } = await client.query(query, [id]);
            if (rows.length > 0) return callback(null, 200, rows);
            return callback('Produto não encontrado', 401)

        } catch (err) {
            console.log(err);
            throw err;
        } finally {
            client.release();
        }

    })().catch(err => { return callback(err, 500); });
};

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

            return callback(null, 200, { sucess: true });
        } catch (err) {
            await client.query('ROLLBACK');
            console.log(err);
            throw err;
        } finally {
            client.release();
        }
    })().catch(err => { return callback(err, 500); });
};

exports.insertSubProduct = (req, res, callback) => {
    const id_product = req.params.id;
    const product = req.body;

    let query = `INSERT INTO subproducts(id_product,material,size,amount,price,old_price,promotion,discount,color)
        VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id as id_subproduct`;

    (async () => {
        const client = await pool.connect();

        try {
            const { rows } = await client.query(query,
                [id_product, product.material, product.size, product.amount, product.price,
                    product.old_price, product.promotion, product.discount, product.color]);

            if (rows.length >= 1) return callback(null, 200, rows);
        } catch (err) {
            await client.query('ROLLBACK');
            console.log(err);
            throw err;
        } finally {
            client.release();
        }
    })().catch(err => { return callback(err, 500); });

};

exports.insertProduct = (req, res, callback) => {
    const product = req.body;

    let query = `INSERT INTO products(id_category,name,description,model,type) 
                VALUES ($1,$2,$3,$4,$5)`;

    (async () => {
        const client = await pool.connect();

        try {
            const rows = await client.query(query,
                [product.id_category, product.name, product.description,
                product.model, product.type])

            if (rows.rowCount >= 1) return callback(null, 200, rows);

        } catch (err) {
            await client.query('ROLLBACK');
            console.log(err);
            throw err;
        } finally {
            client.release();
        }
    })().catch(err => { return callback(err, 500); });

};

exports.put = (req, res, callback) => {
    const id = req.params.id;
    let newObj = {};

    if (req.body.id_category != null) newObj.id_category = req.body.id_category;

    if (req.body.name != null) newObj.name = req.body.name;

    if (req.body.body != null) newObj.model = req.body.model;

    if (req.body.type != null) newObj.type = req.body.type;

    if (req.body.description != null) newObj.description = req.body.description;

    db.knex('products').where({ id: id }).update(newObj).then(result => {
        if (result > 0) return callback(null, 200, { sucess: true });
    }).catch((err) => { console.log(err); return callback(err, 500); });
};

exports.putSubProduct = (req, res, callback) => {
    const id = req.params.id;
    let newObj = {};

    if (req.body.id_product != null) newObj.id_product = req.body.id_product;

    if (req.body.material != null) newObj.material = req.body.material;

    if (req.body.size != null) newObj.size = req.body.size;

    if (req.body.amount != null) newObj.amount = req.body.amount;

    if (req.body.price != null) newObj.price = req.body.price;

    if (req.body.old_price != null) newObj.old_price = req.body.old_price;

    if (req.body.promotion != null) newObj.promotion = req.body.promotion;

    if (req.body.discount != null) newObj.discount = req.body.discount;

    if (req.body.color != null) newObj.color = req.body.color;

    db.knex('subproducts').where({ id: id }).update(newObj).then(result => {
        if (result > 0) return callback(null, 200, { sucess: true });
    }).catch((err) => { console.log(err); return callback(err, 500); });
};

exports.del = (req, res, callback) => {
    const id = req.params.id;

    const selectQuery = `SELECT * FROM products WHERE products.id = ($1)`;
    const delQuery = `DELETE FROM products WHERE id = ($1)`;

    (async () => {
        const client = await pool.connect();

        try {
            let { rows } = await client.query(selectQuery, [id]);
            if (rows.length >= 1) {
                let delResult = await client.query(delQuery, [id]);
                return callback(null, 200, delResult);
            }

        } catch (err) {
            console.log(err);
            throw err;
        } finally {
            client.release();
        }

    })().catch(err => { return callback(err, 500); })

};

exports.delSubProduct = (req, res, callback) => {
    const id = req.params.id;

    const selectImgQuery = `SELECT * FROM images WHERE id_subproduct = ($1)`;
    const deleteImgQuery = `DELETE FROM images WHERE id_subproduct = ($1)`;
    const delQuery = `DELETE FROM subproducts WHERE id = ($1)`;

    (async () => {
        const client = await pool.connect();

        try {
            let { rows } = await client.query(selectImgQuery, [id]);
            if (rows.length > 1) {
                for (let i = 0; i < rows.length; i++) {
                    await s3BucketRemove(rows[i].key_aws);
                    await client.query(deleteImgQuery, [rows[i].id]);
                }
            }
            let delResult = await client.query(delQuery, [id]);
            return callback(null, 200, delResult);

        } catch (err) {
            console.log(err);
            throw err;
        } finally {
            client.release();
        }

    })().catch(err => { return callback(err, 500); })

};

exports.putImages = (req, res, callback) => {
    const idsubproduct = req.params.id;
    const files = req.files;
    const { key, id } = req.body;

    const putQuery = `UPDATE images 
    SET versionID_aws = ($1), location_aws = ($2), bucket_aws = ($3), key_aws = ($4), etag_aws = ($5)
    where id_subproduct = ($6)`;
    const delQuery = `DELETE FROM images where id = ($1)`;

    // thats a whole shit of if else's bruh 
    (async () => {
        const client = await pool.connect();
        try {
            if (files.length == 0) {
                if (Array.isArray(key) && Array.isArray(id)) deleteArrayImages(key, id, client);
                else deleteSingleImage(key, id, client)

            } else {
                if (Array.isArray(key) && Array.isArray(id)) {
                    for (let i = 0; i < files.length; i++) {
                        await deleteArrayImages(key, id, client);
                        result = await s3BucketInsert(files[i]);
                        await client.query(putQuery,
                            [id, result[i].VersionId, result[i].Location, result[i].Bucket, result[i].Key, result[i].ETag, idsubproduct]);
                    }
                } else {
                    await deleteSingleImage(key, id);
                    result = await s3BucketInsert(files[i]);
                    await client.query(putQuery,
                        [id, result[i].VersionId, result[i].Location, result[i].Bucket, result[i].Key, result[i].ETag, idsubproduct]);
                }
            }
            return callback(null, 200, { sucess: true })
        } catch (err) {
            console.log(err);
            throw err;
        } finally {
            client.release();
        }

    })().catch(err => { return callback(err, 500); })

    function deleteArrayImages(key, id, cliente) {
        for (let i = 0; i < key.length; i++) {
            let delRes = s3BucketRemove(key[i]);
            if (delRes) cliente.query(delQuery, [id[i]]);
        }
    }

    function deleteSingleImage(key, id, cliente) {
        let del = s3BucketRemove(key);
        if (del) cliente.query(delQuery, [id]);
    }

}

function s3BucketRemove(key) {
    AWS.config.update({ accessKeyId: db.S3.KEY, secretAccessKey: db.S3.SECRET });
    const s3Bucket = new AWS.S3();
    return new Promise(
        (resolve, reject) => {
            return s3Bucket.deleteObject({
                Bucket: db.S3.BUCKET_PRODUCTS_PATH,
                Key: key
            }, (err, data) => {
                if (err) return reject(err);
                if (data) return resolve(data);
            })
        });
}

function s3BucketInsert(images) {
    AWS.config.update({ accessKeyId: db.S3.KEY, secretAccessKey: db.S3.SECRET });
    const s3Bucket = new AWS.S3();
    const results = [];
    return new Promise(
        (resolve, reject) => {
            images.map((item) => {
                let params = {
                    Bucket: db.S3.BUCKET_PRODUCTS_PATH,
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