'use strict';

const db = require('../secrets/config');
const pg = require('pg');
const pool = new pg.Pool(db.conn);
const TABLE = 'category';
const AWS = require('aws-sdk');

exports.getList = (req, res, callback) => {
    let query = `SELECT DISTINCT ON(category) * FROM category`;

    (async () => {
        const client = await pool.connect();

        try {
            const { rows } = await client.query(query);
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
    let id = { id: req.params.id };
    db.knex.select('*').from(TABLE).where(id).then(result => {
        if (result.length > 0)
            return callback(null, 200, result);
    }).catch((err) => { return callback(err, 500); });
};

exports.insertCategory = (req, res, callback) => {
    let newCat = { category: req.body.category, location_aws: req.body.location_aws, key_aws: req.body.key_aws };

    db.knex(TABLE).insert(newCat).then(result => {
        if (result.rowCount > 0)
            return callback(null, 200, result);
    }).catch((err) => { return callback(err, 500); });
};

exports.putImages = (req,res,callback) => {
    const key = req.body.key;
    

}

exports.addImages = (req, res, callback) => {
    const images = req.files;

    (async () => {
        const client = await pool.connect();

        try {
            let result = await s3BucketInsert(images);
            console.log(result);
            if (result) return callback(null, 200, result);

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
                        Bucket: db.S3.BUCKET_CATEGORY_PATH,
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


exports.updateCategory = (req, res, callback) => {
    const id = { id: req.body.id };
    let newObj = {};

    if (req.body.category != null) newObj.category = req.body.category;

    if (req.body.location_aws != null) newObj.location_aws = req.body.location_aws;

    db.knex(TABLE).where(id).update(newObj).then(result => {
        if (result > 0) return callback(null, 200, { sucess: true });
    }).catch((err) => { console.log(err); return callback(err, 500); });

};

// implement cascade delete logic when the category has a relation with products.
exports.delete = (req, res, callback) => {
    let id = { id: req.params.id };

    db.knex(TABLE).where(id).del().then(result => {
        if (result > 0) return callback(null, 200, { sucess: true });
    }).catch((err) => { return callback(err, 500); });
};





