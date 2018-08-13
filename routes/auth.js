'use strict';

const control = require('../controllers/user');
const router = require('express').Router();
const { execute } = require('../controllers/index');

router.post('/authlogin',
    execute(control.authLogin));



module.exports = router;