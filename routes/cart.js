'use strict';

const control = require('../controllers/cart');
const router = require('express').Router();
const { execute } = require('../controllers/index');

router.get('/loadCart/:id',
    execute(control.getItems));

router.post('/addCart',
    execute(control.addtoCart));

router.delete('/removeCart',
    execute(control.removefromCart));

router.post('/increaseAmount',
    execute(control.increaseAmount));


module.exports = router;