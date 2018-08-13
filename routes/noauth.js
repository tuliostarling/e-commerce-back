'use strict';

const express = require('express');
const router = express.Router();
const control = require('../controllers/user');
const { execute } = require('../controllers');

router.get('/confirm/:hex',
    execute(control.confirmUser));

router.post('/add',
    execute(control.add));


module.exports = router;