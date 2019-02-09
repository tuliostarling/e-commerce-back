'use strict';

const control = require('../controllers/home');
const router = require('express').Router();
const { execute } = require('../controllers/index');

const multer = require('multer');
let storage = multer.memoryStorage()
let upload = multer({ storage: storage });

router.get('/getHomeProducts/',
    execute(control.getHomeProducts));

router.post('/addHomeProducts',
    execute(control.addHomeProducts));

router.post('/updatePosition',
    execute(control.updatePositionHomeProduct));

router.delete('/removeHomeProducts/:id',
    execute(control.removeHomeProducts));

router.get('/getHomeImages/',
    execute(control.getHomeImages));

router.get('/getAllSubProducts/',
    execute(control.getAllSubProducts));

router.post('/addImages/',
    upload.array('file', 3),
    execute(control.addImages));

router.put('/putImages/',
    upload.array('file', 3),
    execute(control.putImages));

module.exports = router;