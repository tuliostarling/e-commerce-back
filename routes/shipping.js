'use strict';

const control = require('../controllers/shipping');
const router = require('express').Router();
const { execute } = require('../controllers/index');


router.post('/shippingPrice',
    execute(control.getShipPrice));

router.post('/shippingInfo',
    execute(control.getShipInfo));


module.exports = router;