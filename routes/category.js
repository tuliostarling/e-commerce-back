'use strict';

const control = require('../controllers/category');
const router = require('express').Router();
const { execute } = require('../controllers/index');

const multer = require('multer');
let storage = multer.memoryStorage()
let upload = multer({ storage: storage });


router.get('/listall/',
    execute(control.getList));

router.get('/listone/:id',
    execute(control.getOne));

router.post('/add/',
    execute(control.insertCategory));

router.post('/addImages/',
    upload.array('file',1),
    execute(control.addImages));

router.put('/put/',
    execute(control.updateCategory));

router.delete('/del/:id',
    execute(control.delete));

module.exports = router;