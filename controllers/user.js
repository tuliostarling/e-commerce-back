'use strict';
const crypto = require('crypto');
const bufferData = require('../models/buffer');
const mail = require('../wrappers/mail');
const uuidv4 = require('uuid/v4');
const generateToken = require('../controllers/jwt');
const jwt = require('jsonwebtoken');
const db = require('../secrets/config');
const pg = require('pg');
const pool = new pg.Pool(db.conn);

const DB = require('../wrappers/db');
const POOL = DB.getPool();
const TABLE = 'users';

exports.add = (req, res, callback) => {

    db.knex('users').where({ email: req.body.email }).then(result => {
        if (result.length > 0) return callback('Email ja registrado', 404);

        let hash = uuidv4();
        let hashpassword = crypto.createHash('sha512').update(req.body.password).digest('hex');
        new bufferData({ name: req.body.name, email: req.body.email, password: hashpassword, admin: req.body.admin, hashed: hash })
            .save((err, obj) => {
                if (err) return callback(err, 500);// REFATORAR
                let email = req.body.email;
                //let url = 'http://www.tutuguerra.com.br/confirm/' + hash + '/';
                let url = 'localhost:3000/api/confirm/' + hash + '/';
                mail.send({
                    to: email,
                    subject: 'Parabéns pela sua conta na Tutu Guerra',
                    html: `Olá ${email}, Para confirmar seu cadastro acesse o link a seguir ${url}`
                }, (err) => {
                    if (err) return callback(err, 500);
                    return callback(null, 200, { success: true });
                });
            });

    }).catch((err) => { return callback(err, 500) });
};

exports.confirmUser = (req, res, callback) => {
    let { hex } = req.params;
    if (!hex) return callback('URL INSERIDA INCORRETA', 400);

    bufferData.findOneAndUpdate({ hashed: hex }, { $unset: { createdAt: 1 } }
        , { multi: false }, (err, user) => {
            if (err)
                return callback(err, 500);
            else if (!user)
                return callback('Código de confirmação expirado, crie seu Usuario novamente', 404); //REFATORAR para avisar que o codigo expirou ou ja foi confirmado

            let newUser = { name: user.name, password: user.password, email: user.email, hashtoken: user.hashed, admin: user.admin };
            let queryUser = `INSERT INTO users(name,password,email,hashtoken,admin) VALUES ($1,$2,$3,$4,$5) RETURNING id`;

            (async () => {
                const client = await pool.connect();

                try {
                    await client.query('BEGIN');

                    const { rows } = await client.query(queryUser,
                        [newUser.name, newUser.password, newUser.email, newUser.hashtoken, newUser.admin]);

                    let query = `WITH insCart AS (
                                    INSERT INTO cart(id_user) 
                                    VALUES ($1)
                                    ON CONFLICT DO NOTHING
                                    RETURNING id_user
                                    )
                                    INSERT INTO wishlist(id_user) 
                                    SELECT id_user FROM insCart
                                    `;
                    await client.query(query, [rows[0].id]);

                    await client.query('COMMIT');
                    user.remove();
                    return callback(null, 200, { sucess: true });
                } catch (err) {
                    await client.query('ROLLBACK');
                    console.log(err);
                    throw err;
                } finally {
                    client.release();
                }
            })().catch(err => { return callback(err, 500); });
        });
};

exports.newPass = (req, res, callback) => {
    let query = { email: req.body.email };
    let oldpass = req.body.oldpass;
    let newpassword = req.body.newpass;

    newpassword = crypto.createHash('sha512').update(newpassword).digest('hex');

    db.knex.transaction(async (trx) => {
        try {
            let obj = await trx.select('password').from('users').where(query);

            if (obj.length <= 0) return callback('Usuário não existente', 404);
            if (hashPass(oldpass) != obj[0].password) return callback('Senha Incorreta', 401);

            let result = await trx.where(query).update({ password: newpassword }).into('users');

            if (result >= 1) return callback('Senha Alterada com Sucesso', 200);
        } catch (err) {
            return callback(err, 500);
        }
    });
};

exports.authLogin = (req, res, callback) => {
    let query = { email: req.body.email };
    let pass = req.body.password;

    db.knex.transaction(async (trx) => {
        try {
            let obj = await trx.select('*').from('users').where(query);

            if (obj.length <= 0) return callback('Usuário não existente', 404);
            if (hashPass(pass) != obj[0].password) return callback('Senha Incorreta', 401);

            let cart = await trx.select('*').from('cart').where({ id_user: obj[0].id });
            let wishlist = await trx.select('*').from('wishlist').where({ id_user: obj[0].id });

            const hash = obj[0].hashtoken;
            return callback(null, 200, { token: generateToken(hash, { id: obj[0].id, name: obj[0].name, admin: obj[0].admin, cart: cart[0].id, wishlist: wishlist[0].id, cep: obj[0].cep }) });

        } catch (err) {
            return callback(err, 500);
        }
    });
};

exports.validatetoken = (req, res, callback) => {
    const { token } = req.body;
    const decoded = jwt.decode(token);

    db.knex('users').where({ id: decoded.id }).then(result => {
        if (result.length <= 0) return callback('Usuario não existe', 404);

        jwt.verify(token, result[0].hashtoken, (err) => {
            if (err) return callback('Token invalid', 401);
            return callback(null, 200, { validatetoken: true });

        });

    }).catch(err => { return callback(err, 500); });
};

exports.insertCoupon = (req, res, callback) => {
    const data = req.body;

    const validatequery = `
    SELECT * from user_coupons 
    where id_coupon = (SELECT id from coupons where name = ($1))	
	AND id_user = ($2)
    ;`;

    const insertquery = `INSERT into user_coupons (id_user,id_coupon,used)
    VALUES (($1),(SELECT id from coupons where name = ($2)),false)
    ON CONFLICT DO NOTHING
    RETURNING id 
    `;
    (async () => {
        const client = await pool.connect();

        try {
            const { rows } = await client.query(validatequery, [data.coupon, data.id]);
            if (rows.length > 0) return callback('Coupon ja inserido.', 401);

            const result = await client.query(insertquery, [data.id, data.coupon])
            if (result.rows.length > 0) return callback(null, 200, result);

        } catch (err) {
            console.log(err);
            throw err;
        } finally {
            client.release();
        }

    })().catch(err => { return callback(err, null); });

};

exports.verifyCoupon = (req, res, callback) => {
    const couponName = req.body.coupon;

    const query = `
        SELECT * FROM coupons c , user_coupons uc
        WHERE c.name LIKE ($1)
        AND c.valid = true
        AND uc.used = false
        AND c.expire_at > CURRENT_DATE
        AND uc.id_coupon NOT IN (c.id)
    `;

    POOL.query(query, [couponName]).then(result => {
        if (result) {
            const { rows } = result;
            if (rows.length > 0) return callback(null, 200, rows);
        }
    }).catch((err) => { return callback(err, 500); });

};

exports.getUserCoupon = (req, res, callback) => {
    const userId = req.params.id;

    const query = `            
        SELECT * FROM user_coupons uc, coupons c
        WHERE uc.id_user = ($1)
        AND c.id = uc.id_coupon
        AND uc.used = false 
        AND c.valid = true
        AND c.expire_at > CURRENT_DATE
    `;

    POOL.query(query, [userId]).then(result => {
        if (result.rows.length > 0) return callback(null, 200, result.rows);
    }).catch((err) => { return callback(err, 500); });
};

exports.update = (req, res, callback) => {
    const {
        id,
        name,
        cep,
        cpf,
        state,
        city,
        street,
        neighborhood,
        num,
        comp
    } = req.body;
    let updateObj = {};

    db.knex.transaction(async (trx) => {
        try {
            if (name != null && name != undefined) updateObj.name = name;
            if (cep != null && cep != undefined) updateObj.cep = cep.replace(".", "").replace("-", "");
            if (cpf != null && cpf != undefined) updateObj.cpf = cpf.replace(".", "").replace(".", "").replace("-", "");
            if (state != null && state != undefined) updateObj.state = state;
            if (city != null && city != undefined) updateObj.city = city;
            if (street != null && street != undefined) updateObj.street = street;
            if (neighborhood != null && neighborhood != undefined) updateObj.neighborhood = neighborhood;
            if (num != null && num != undefined) updateObj.num = num;
            if (comp != null && comp != undefined) updateObj.comp = comp;

            let obj = await trx.select('*').from('users').where({ id: req.body.id });

            if (obj.length <= 0) return callback('Usuário não existente', 404);
            let result = await trx.where({ id: id }).update({
                name: updateObj.name, cpf: updateObj.cpf,
                state: updateObj.state, city: updateObj.city,
                street: updateObj.street, neighborhood: updateObj.neighborhood, num: updateObj.num,
                comp: updateObj.comp, cep: updateObj.cep
            }).into('users');
            if (result >= 1) return callback(null, 200, { sucess: true });
        } catch (err) {
            return callback(err, 500);
        }
    });
};

exports.getOne = (req, res, callback) => {
    let id = { id: req.params.id };

    db.knex.select('*').from(TABLE).where(id).then(result => {
        if (result.length > 0)
            return callback(null, 200, result);
    }).catch((err) => { return callback(err, 500); });
};

exports.getPurchases = (req, res, callback) => {
    const idUser = req.body.id_user;

    const query = `
        SELECT id, status, created_at
        FROM purchases WHERE id_user = ($1);
        `;

    POOL.query(query, [idUser]).then(result => {
        if (result.rows.length > 0) return callback(null, 200, result.rows);
    }).catch(err => { return callback(err, 500); })

};

exports.getOnePurchase = (req, res, callback) => {
    const idPurchase = req.params.id;
    const query = `
        SELECT p.id, p.id_user, p.adress, p.status, p.created_at,
        p.sale, ip.name, ip.price , ip.quantity, ip.currency
        FROM item_purchases ip, purchases p
        WHERE sale ->> 'id' = ($1)
        AND p.id = ip.id_purchase
        `;

    POOL.query(query, [idPurchase]).then(result => {
        if (result) {
            const { rows } = result;
            if (rows.length > 0) return callback(null, 200, rows);
        }
        else return callback('No coupons', 404);
    }).catch(err => { return callback(err, 500); })
};

function hashPass(pass) {
    return crypto.createHash('sha512').update(pass).digest('hex');
}