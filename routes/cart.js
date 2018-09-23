'use strict';

const control = require('../controllers/cart');
const router = require('express').Router();
const { execute } = require('../controllers/index');

router.get('/loadCart',
    execute(control.getItems));

router.post('/addCart',
    execute(control.addtoCart));


module.exports = router;