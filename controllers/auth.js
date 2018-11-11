
const jwt = require('jsonwebtoken');
const db = require('../secrets/config');

module.exports = (req, res, next, callback) => {
    const { authorization } = req.headers;

    if (!authorization)
        return res.status(404).send({ errorMessage: 'No token provided' });

    const parts = authorization.split(' ');

    if (!parts.length == 2)
        return res.status(404).send({ errorMessage: 'Token error' });

    const [scheme, token] = parts;

    if (!/^Bearer$/i.test(scheme))
        return res.status(401).send({ errorMessage: 'Token malformatted' });

    const decoded = jwt.decode(token);

    if (!decoded) return res.status(401).send({ errorMessage: 'Token malformatted' });

    if (!decoded.hasOwnProperty('id')) return res.status(401).send({ errorMessage: 'Token malformatted' });


    db.knex('users').where({ id: decoded.id }).then(result => {
        if (result.length <= 0) return callback('User Not Found.', 404);

        jwt.verify(token, result[0].hashToken, (err, decoded) => {
            if (err) return callback('Token invalid', 404);
            // Repassa informações na requição
            req.id = decoded.id;
            req.name = decoded.name;
            req.admin = decoded.admin;
            req.cart = decoded.cart;
            req.wishlist = decoded.wishlist;
            req.cep = decoded.cep;
            
            return next();
        });


    }).catch(err => { return callback(err, 500); });

};

