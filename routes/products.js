'use strict';

const control = require('../controllers/product');
const router = require('express').Router();
const { execute } = require('../controllers/index');


router.post('/listall/',
    execute(control.getList));

router.post('/listone/',
    execute(control.getOne));

router.post('/addProduct/',
    execute(control.insertProduct));



module.exports = router;