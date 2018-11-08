'use strict';

const control = require('../controllers/comment');
const router = require('express').Router();
const { execute } = require('../controllers/index');

router.post('/addComment',
    execute(control.addComment));

router.get('/getComment/:id',
    execute(control.getComment));



module.exports = router;