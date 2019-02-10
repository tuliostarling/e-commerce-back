'use strict';

const control = require('../controllers/payment');
const router = require('express').Router();
const { execute } = require('../controllers/index');

router.post('/payCart',
    execute(control.payCart));

router.post('/sucessPay',
    execute(control.sucessPay));

router.post('/cancelPay',
    execute(control.cancelPay));


module.exports = router;