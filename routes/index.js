'use strict';

const auth = require('../controllers/auth');
const router = require('express').Router();
const user = require('./user');

// Cria routes que não requerem autenticação
router.use('/', require('./noauth'));

// Rotas Autenticadas
router.use('/auth', require('./auth')); // Login

router.use(auth);//MiddleWare Validando Token antes do usuario seguir.

router.use('/user', user);// criação de conta.



module.exports = router;
