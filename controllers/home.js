'use strict';

const db = require('../secrets/config');
const pg = require('pg');
const pool = new pg.Pool(db.conn);
const DB = require('../wrappers/db');
const POOL = DB.getPool();
const TABLE = 'home';
const AWS = require('aws-sdk');

exports.getHomeTypes = (req, res, callback) => {
    let query = `SELECT * FROM home`;

    POOL.query(query).then(result => {
        if (result) {
            const { rows } = result;
            if (rows.length > 0) return callback(null, 200, rows);
        }
    }).catch((err) => { return callback(err, 500); });
};

exports.insertCarouselImage = (req, res, callback) => {
    let newCarousel = { id_home: req.body.id_home, location_aws: req.body.location_aws, key_aws: req.body.key_aws };

    db.knex('carousel_images').insert(newCarousel).then(result => {
        if (result.rowCount > 0)
            return callback(null, 200, result);
    }).catch((err) => { return callback(err, 500); });
};

exports.addImages = (req, res, callback) => {
    const images = req.files;

    (async () => {
        try {
            let result = await s3BucketInsert(images);
            if (result) return callback(null, 200, result);

        } catch (err) {
            console.log(err);
            throw err;
        }
    })().catch(err => { return callback(err, 500); });
};

exports.putImages = (req, res, callback) => {
    const images = req.files;

    (async () => {
        try {
            let result = await s3BucketUpdate(images);
            if (result) return callback(null, 200, result);

        } catch (err) {
            console.log(err);
            throw err;
        }
    })().catch(err => { return callback(err, 500); });


    function s3BucketUpdate(images) {
        AWS.config.update({ accessKeyId: db.S3.KEY, secretAccessKey: db.S3.SECRET });
        const s3Bucket = new AWS.S3();
        return new Promise(
            (resolve, reject) => {
                return s3Bucket.deleteObject({
                    Bucket: db.S3.BUCKET_CATEGORY_PATH,
                    Key: req.body.key_aws
                }, (err, data) => {
                    if (err) return reject(err);
                    if (data) return resolve(s3BucketInsert(images));
                })
            });
    }
}

exports.getAllSubProducts = (req, res, callback) => {
    let query = `SELECT * FROM subproducts`;

    POOL.query(query).then(result => {
        if (result) {
            const { rows } = result;
            if (rows.length > 0) return callback(null, 200, rows);
        }
    }).catch((err) => { return callback(err, 500); });
};

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