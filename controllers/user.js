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



exports.add = (req, res, callback) => {

    db.knex('users').where({ email: req.body.email }).then(result => {
        if (result.length > 0) return callback('Email ja registrado', 404);

        let hash = uuidv4();
        let hashpassword = crypto.createHash('sha512').update(req.body.password).digest('hex');
        new bufferData({ name: req.body.name, email: req.body.email, password: hashpassword, admin: req.body.admin, hashed: hash })
            .save((err) => {
                if (err) return callback(err, 500);// REFATORAR
                let email = req.body.email;
                let url = 'localhost:3000/confirm/' + hash + '/';

                mail.send({
                    to: email,
                    subject: 'Parabéns pela sua conta na Tutu Guerra',
                    html: '<p>Parabeins rapaiz clica aqui pa nos e passa o paiero ' + url.toString('utf8') + '.</p>'
                }, (err) => {
                    if (err) return callback(err, 500);
                    return callback(null, 200, url);
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
                    return callback(null, 200, 'Usuario Criado com sucesso');//REFATORAR Redicionar usuario para pagina do ecommerce apos confirmar a conta.
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
    db.knex('users').where(query).then(result => {

        if (result.length <= 0) return callback('Usuário não existente', 404);

        if (hashPass(pass) != result[0].password) return callback('Senha Incorreta', 401);

        const hash = result[0].hashtoken;

        return callback(null, 200, { token: generateToken(hash, { id: result[0].id, name: result[0].name, admin: result[0].admin }) });

    }).catch(err => { return callback(err, 500) });
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
            if (rows.length > 0) return callback(null, 401, 'Coupon ja inserido.');

            const result = await client.query(insertquery, [data.id, data.coupon])
            if (result.rows.length > 0) return callback(null, 200, 'Coupon inserido!');

        } catch (err) {
            console.log(err);
            throw err;
        } finally {
            client.release();
        }

    })().catch(err => { return callback(err, null); });

};

function hashPass(pass) {
    return crypto.createHash('sha512').update(pass).digest('hex');
}