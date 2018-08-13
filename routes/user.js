'use strict';

const control = require('../controllers/user');
const router = require('express').Router();
const { execute } = require('../controllers');


router.post('/newpass',
    execute(control.newPass));
    


module.exports = router;
