'use strict';

const control = require('../controllers/wishlist');
const router = require('express').Router();
const { execute } = require('../controllers/index');

router.get('/loadWishList/:id',
    execute(control.getItems));

router.post('/addtoWishList',
    execute(control.addtoWishList));

router.delete('/removeWishList/:id',
    execute(control.removefromWishList));

module.exports = router;