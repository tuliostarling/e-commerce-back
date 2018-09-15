'use strict';

const control = require('../controllers/product');
const router = require('express').Router();
const { execute } = require('../controllers/index');
let upload = require('../secrets/config');

router.post('/listall/',
    execute(control.getList));

router.get('/listone/:id',
    execute(control.getOne));

router.get('/prodimg/:id',
    execute(control.productImage));

router.post('/add/',
    upload.upload.array('file', 2),//@ToDo change this upload.upload later 
    execute(control.insertProduct));

router.put('/put/',
    execute(control.updateProduct));

router.delete('/del/',
    execute(control.delete));


module.exports = router;