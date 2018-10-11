'use strict';

const control = require('../controllers/product');
const router = require('express').Router();
const { execute } = require('../controllers/index');

const multer = require('multer');
let storage = multer.memoryStorage()
let upload = multer({ storage: storage });

router.get('/listAll/Promotions',
    execute(control.getAllPromotions));

router.get('/listAll/Products',
    execute(control.getListMainProduct));

router.get('/listall/',
    execute(control.getAll));

router.get('/listBycategory/:id',
    execute(control.getList));

router.get('/listone/:id',
    execute(control.getOne));

router.post('/add/',
    execute(control.insertProduct));

router.post('/add/subProduct',
    execute(control.insertSubProduct));

router.post('/addImages/:id',
    upload.array('file', 5),
    execute(control.addImages));

router.put('/put/',
    execute(control.updateProduct));

router.delete('/del/',
    execute(control.delete));


module.exports = router;