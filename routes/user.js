'use strict';

const control = require('../controllers/user');
const router = require('express').Router();
const { execute } = require('../controllers');


router.post('/newpass',
    execute(control.newPass));

router.post('/add',
    execute(control.add));

router.post('/addCoupon',
    execute(control.insertCoupon));

router.put('/put',
    execute(control.update));

module.exports = router;
