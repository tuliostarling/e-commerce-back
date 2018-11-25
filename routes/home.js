'use strict';

const control = require('../controllers/home');
const router = require('express').Router();
const { execute } = require('../controllers/index');

const multer = require('multer');
let storage = multer.memoryStorage()
let upload = multer({ storage: storage });

router.get('/getHomeTypes/',
    execute(control.getHomeTypes));

router.get('/getAllSubProducts/',
    execute(control.getAllSubProducts));

router.post('/add/',
    execute(control.insertCarouselImage));

router.post('/addImages/',
    upload.array('file', 3),
    execute(control.addImages));

router.put('/putImages/',
    upload.array('file', 3),
    execute(control.putImages));

module.exports = router;