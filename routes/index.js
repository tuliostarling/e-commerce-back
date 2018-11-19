'use strict';

const auth = require('../controllers/auth');
const router = require('express').Router();
const user = require('./user');
const product = require('./products');
const category = require('./category');
const coupon = require('./coupon');
const cart = require('./cart');
const wishlist = require('./wishlist');
const comment = require('./comment');
const shipping = require('./shipping');
const payment = require('./payment');
const authentication = require('./auth');
const noauth = require('./noauth')

// Cria routes que não requerem autenticação
router.use('/', noauth);
router.use('/product', product);
router.use('/category', category);
router.use('/coupon', coupon);
router.use('/comment', comment);
router.use('/shipping', shipping);
router.use('/payment', payment);

router.use('/auth', authentication); // Login

// Rotas Autenticadas
router.use(auth);//MiddleWare Validando Token antes do usuario seguir.

router.use('/user', user);// criação de conta.
router.use('/cart', cart);
router.use('/wishlist', wishlist);


module.exports = router;
