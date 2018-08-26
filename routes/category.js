'use strict';

const control = require('../controllers/category');
const router = require('express').Router();
const { execute } = require('../controllers/index');

router.get('/listall/',
    execute(control.getList));

router.post('/listone/',
    execute(control.getOne));

router.post('/add/',
    execute(control.insertCategory));

router.put('/put/',
    execute(control.updateCategory));

router.delete('/del/',
    execute(control.delete));

module.exports = router;