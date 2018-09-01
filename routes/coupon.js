'use strict';

const control = require('../controllers/coupon');
const router = require('express').Router();
const { execute } = require('../controllers/index');

router.post('/add',
    execute(control.addCoupon));

router.get('/get/:id',
    execute(control.getCoupon));

router.get('/getall',
    execute(control.getAllCoupon));

router.delete('/del/:id',
    execute(control.delCoupon));

router.put('/put',
    execute(control.updateCoupon));

module.exports = router;