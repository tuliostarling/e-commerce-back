'use strict';

const control = require('../controllers/product');
const router = require('express').Router();
const { execute } = require('../controllers/index');

const multer = require('multer');
let storage = multer.memoryStorage()
let upload = multer({ storage: storage });

router.post('/listall/',
    execute(control.getList));

router.get('/listone/:id',
    execute(control.getOne));
    
router.post('/add/',
    upload.array('file', 2),
    execute(control.insertProduct));

router.put('/put/',
    execute(control.updateProduct));

router.delete('/del/',
    execute(control.delete));


module.exports = router;