'use strict';

const control = require('../controllers/wishlist');
const router = require('express').Router();
const { execute } = require('../controllers/index');

router.get('/loadWishList/:id',
    execute(control.getItems));

module.exports = router;