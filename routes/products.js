'use strict';

const control = require('../controllers/product');
const router = require('express').Router();
const { execute } = require('../controllers/index');

const multer = require('multer');
let storage = multer.memoryStorage()
let upload = multer({ storage: storage });

// General Routes.
router.get('/listAll/Promotions/:page',
    execute(control.getAllPromotions));

router.post('/addImages/:id',
    upload.array('file', 5),
    execute(control.addImages));

router.get('/listAll/Products/',
    execute(control.getListMainProduct));

router.get('/listBycategory/:id/:page',
    execute(control.getListByCategory));

router.get('/listone/:id',
    execute(control.getOne));


// Main Product Routes.

router.get('/listoneMain/:id',
    execute(control.getOneMain));

router.post('/add/',
    execute(control.insertProduct));

router.put('/put/:id',
    execute(control.put));

router.delete('/del/:id',
    execute(control.del));

// Sub Products Routes.

router.get('/listall/SubProducts/:id',
    execute(control.getAllSubProduct));

router.post('/addSubProduct/:id',
    execute(control.insertSubProduct));

router.put('/putImages/:id',
    upload.array('file', 5),
    execute(control.putImages));

router.put('/putSubProduct/:id',
    execute(control.putSubProduct));

router.delete('/delSubProduct/:id',
    execute(control.delSubProduct));


module.exports = router;