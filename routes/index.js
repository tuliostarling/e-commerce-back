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
const home = require('./home');
const authentication = require('./auth');
const noauth = require('./noauth')

// Cria routes que não requerem autenticação
router.use('/', noauth);
router.use('/product', product);
router.use('/category', category);
router.use('/comment', comment);
router.use('/shipping', shipping);
router.use('/auth', authentication); // Login

// Rotas Autenticadas
router.use(auth);//MiddleWare Validando Token antes do usuario seguir.

router.use('/user', user);// criação de conta.
router.use('/cart', cart);
router.use('/wishlist', wishlist);
router.use('/payment', payment);
router.use('/coupon', coupon);
router.use('/home', home);


module.exports = router;
