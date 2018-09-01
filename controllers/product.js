'use strict';

const db = require('../secrets/config');
const { Client } = require('pg');
const pg = new Client(db.conn);
const TABLE = 'products';

exports.insertProduct = (req, res, callback) => {
    let defaultProduct = req.body.defaultProduct;
    let array = req.files;
    let product = {
        id_category: 1,
        name: req.body.name,
        size: 38,
        amount: 10,
        price: 50,
        discount: true,
        description: 'Sapatebs',
        color: 'red'
    };
    let query;

    if (defaultProduct) {
        query = `
        WITH insert1 AS (
            INSERT INTO products(id_category,name,size,amount,price,discount,description,color)
            VALUES($1,$2,$3,$4,$5,$6,$7,$8)
            ON   CONFLICT DO NOTHING
            RETURNING id as product_id
        ),
        insert2 AS (
            INSERT INTO subproducts(id_product,name,size,amount,price,discount,description,color)
            VALUES((select product_id from insert1),$2,$3,$4,$5,$6,$7,$8)
            ON   CONFLICT DO NOTHING
            RETURNING id as subproduct_id
        )
        INSERT into images(id_subproduct,image_type,image_name,image)
        VALUES((select subproduct_id from insert2),unnest(ARRAY[$9]),unnest(ARRAY[$10]),unnest(ARRAY[$11]))
        `;
    } else {
        query = ``;
    }

    const images = array.reduce((prev, curr) => {
        return {
            name: [...prev.name, curr.originalname],
            type: [...prev.type, curr.mimetype],
            buffer: [...prev.buffer, curr.buffer]
        }
    }, { name: [], type: [], buffer: [] });

    pg.connect((err) => {
        if (err) return callback(err, 500);

        pg.query(query,
            [product.id_category, product.name, product.size, product.amount, product.price, product.discount, product.description, product.color,
            images.name, images.type, images.buffer]
            , (err, result) => {
                console.log(err);
                if (err) return callback(err, 401);
                if (result.rowCount > 0) return callback(null, 200, 'Imagem salva com sucesso');
                pg.end();
            });

    });
};


exports.getList = (req, res, callback) => {

    db.knex.select('*').from('product').where({ id: 2 }).then(result => {
        if (result.length > 0) {
            console.log(result[0].image);
            let image = Buffer.from(result[0].image, "base64");

            res.writeHead(200, {
                'Content-Type': 'image/png',
                'Content-disposition': 'attachment;filename=' + 'toot',
            });
            res.end(image);
        }

    }).catch((err) => { return callback(err, 500) });
};


exports.getOne = (req, res, callback) => {
    
};



