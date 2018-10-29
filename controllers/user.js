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
                let url = 'tutuguerra.com.br/confirm/' + hash + '/';

                mail.send({
                    to: email,
                    subject: 'Parabéns pela sua conta na Tutu Guerra',
                    html: `Olá ${email}, Para confirmar seu cadastro acesse o link a seguir ${url}`
                }, (err) => {
                    if (err) return callback(err, 500);
                    return callback(null, 200, { id: obj._id });
                });
            });

    }).catch((err) => { return callback(err, 500) });
};

exports.confirmUser = (req, res, callback) => {
    let { hex } = req.params;

    if (!hex) return callback('URL INSERIDA INCORRETA', 400);

    bufferData.findOneAndUpdate({ hashed: { $exists: true } }, { $unset: { expDate: 1 } }
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

                    let queryCart = `INSERT INTO cart(id_user) VALUES ($1)`;
                    await client.query(queryCart, [rows[0].id]);

                    await client.query('COMMIT');
                    user.remove();
                    return res.redirect('tutuguerra.com');// callback(null, 200, 'Usuario confirmado com sucesso') REFATORAR Redicionar usuario para pagina do ecommerce apos confirmar a conta.
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
    let oldpass = req.body.oldpassword;
    let newpassword = req.body.newpassword;

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

            const hash = obj[0].hashtoken;

            return callback(null, 200, { token: generateToken(hash, { id: obj[0].id, name: obj[0].name, admin: obj[0].admin, cart: cart[0].id }) });

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

exports.update = (req, res, callback) => {
    const {
        id,
        name,
        email
    } = req.body;
    let updateObj = {};

    db.knex.transaction(async (trx) => {
        try {

            if (name != null && name != undefined) updateObj.name = name;
            if (email != null && email != undefined) updateObj.email = email;

            let obj = await trx.select('*').from('users').where({ id: req.body.id });

            if (obj.length <= 0) return callback('Usuário não existente', 404);

            let result = await trx.where({ id: id }).update({ name: updateObj.name, email: updateObj.email }).into('users');

            if (result >= 1) return callback(null, 200, result);
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


function hashPass(pass) {
    return crypto.createHash('sha512').update(pass).digest('hex');
}