'use strict';

const db = require('../secrets/config');
const pg = require('pg');
const pool = new pg.Pool(db.conn);
const DB = require('../wrappers/db');
const POOL = DB.getPool();
const AWS = require('aws-sdk');


exports.getAllSubProducts = (req, res, callback) => {
    let query = `SELECT * FROM subproducts`;

    POOL.query(query).then(result => {
        if (result) {
            const { rows } = result;
            if (rows.length > 0) return callback(null, 200, rows);
        }
    }).catch((err) => { return callback(err, 500); });
};

exports.getHomeProducts = (req, res, callback) => {
    let query = `SELECT * FROM home_products`;

    POOL.query(query).then(result => {
        if (result) {
            const { rows } = result;
            if (rows.length > 0) return callback(null, 200, rows);
        }
    }).catch((err) => { return callback(err, 500); });
};

exports.getHomeImages = (req, res, callback) => {
    const query = `SELECT * FROM home_images`;

    POOL.query(query).then(result => {
        if (result) {
            const { rows } = result;
            if (rows.length > 0) return callback(null, 200, rows);
        }
        else return callback('Nenhum banner inserido ainda', 301);
    }).catch((err) => { return callback(err, 500); });
};

exports.addImages = (req, res, callback) => {
    const images = req.files;

    const imageQuery = `
            INSERT INTO home_images(location_aws,key_aws) 
            VALUES ($1,$2)`;

    (async () => {
        const client = await pool.connect();
        try {
            let s3Result = await s3BucketInsert(images);

            for (let i = 0; i < s3Result.length; i++) {
                await client.query(imageQuery,
                    [s3Result[i].Location, s3Result[i].Key]);
            }

            return callback(null, 200, { sucess: true });
        } catch (err) {
            console.log(err);
            throw err;
        }
    })().catch(err => { return callback(err, 500); });
};

exports.putImages = (req, res, callback) => {
    const files = req.files;
    const { key, id } = req.body;
    console.log(files)
    console.log(req.body);
    const putQuery = `UPDATE home_images 
    SET location_aws = ($1), key_aws = ($2)
    where id = ($3)`;
    const insertQuery = `INSERT INTO home_images(location_aws,key_aws) VALUES ($1,$2)`;
    const delQuery = `DELETE FROM home_images where id = ($1)`;

    ////thats a whole shit of if else's bruh 
    (async () => {
        const client = await pool.connect();
        try {
            if (files.length == 0) {
                if (Array.isArray(key) && Array.isArray(id)) deleteArrayImages(key, id, client);
                else deleteSingleImage(key, id, client)

            } else {
                if (Array.isArray(key) && Array.isArray(id) && (files.length == key.length)) {
                    let result = await s3BucketInsert(files);
                    if (result != undefined) {
                        for (let i = 0; i < result.length; i++) {
                            await client.query(putQuery,
                                [result[i].Location, result[i].Key, id[i]]);
                        }
                    }
                } else if (Object.keys(req.body).length === 0) {
                    let result = await s3BucketInsert(files);
                    if (result != undefined) {
                        for (let i = 0; i < result.length; i++) {
                            await client.query(insertQuery,
                                [result[i].Location, result[i].Key]);
                        }
                    }
                } else {
                    await deleteSingleImage(key, id, client);
                    let result = await s3BucketInsert(files);
                    await client.query(putQuery,
                        [result[i].Location, result[i].Key, id]);
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

function s3BucketInsert(images) {
    AWS.config.update({ accessKeyId: db.S3.KEY, secretAccessKey: db.S3.SECRET });
    const s3Bucket = new AWS.S3();
    const results = [];
    return new Promise(
        (resolve, reject) => {
            //if (Array.isArray(images)) {
            images.map((item) => {
                let params = {
                    Bucket: db.S3.BUCKET_HOME_PATH,
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
            // } else {
            //     let resultAux = [];
            //     resultAux.push(images);
            //     let params = {
            //         Bucket: db.S3.BUCKET_HOME_PATH,
            //         Key: images.originalname,
            //         Body: images.buffer,
            //         ContentType: images.mimetype,
            //         ACL: 'public-read'
            //     };

            //     return s3Bucket.upload(params, (err, result) => {
            //         if (err) return reject(err);
            //         results.push(result);
            //         if (results.length == resultAux.length) console.log("notarray" + JSON.stringify(results)); return resolve(result);
            //     });
            // }

        });
}

function s3BucketRemove(key) {
    AWS.config.update({ accessKeyId: db.S3.KEY, secretAccessKey: db.S3.SECRET });
    const s3Bucket = new AWS.S3();
    return new Promise(
        (resolve, reject) => {
            return s3Bucket.deleteObject({
                Bucket: db.S3.BUCKET_HOME_PATH,
                Key: key
            }, (err, data) => {
                if (err) return reject(err);
                if (data) return resolve(data);
            })
        });
}

