'use strict';

const auth = require('../controllers/auth');
const router = require('express').Router();
const user = require('./user');
const product = require('./products');
const category = require('./category');
const coupon = require('./coupon');
const authentication = require('./auth');
const noauth = require('./noauth')


// Cria routes que não requerem autenticação
router.use('/', noauth);
router.use('/product', product);
router.use('/category', category);
router.use('/coupon', coupon);


router.use('/auth', authentication); // Login

// Rotas Autenticadas
router.use(auth);//MiddleWare Validando Token antes do usuario seguir.

router.use('/user', user);// criação de conta.


module.exports = router;
