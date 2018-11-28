'use strict';

const control = require('../controllers/dashboard');
const router = require('express').Router();
const { execute } = require('../controllers/index');

router.get('/getsellout/:page',
    execute(control.getPurchases));

router.post('/sendUserCode',
    execute(control.sendCode));


module.exports = router;