const router = require('express').Router();
const passport = require('passport');
const { execute } = require('../controllers/index');

router.get('/google',
    passport.authenticate('google', { scope: ['profile'] })
);

router.get('/google/callback',
    passport.authenticate('google', { failureRedirect: '/login' }),
    (req, res) => {
        console.log(res);
        console.log(req);
    }
);

module.exports = router;