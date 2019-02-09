const router = require('express').Router();
const passport = require('passport');
const { execute } = require('../controllers/index');
const fetch = require("node-fetch");

const googleAuth = passport.authenticate('google', { scope: ['profile', 'email'] });

router.get('/google', googleAuth);

router.get('/google/callback',
    passport.authenticate('google', { failureRedirect: '/login', session: false }),
    (req, res) => {
        const body = { email: res.emails[0].value, password: res.id }
        fetch('localhost:3000/api/auth/authlogin', {
            method: 'post',
            body: JSON.stringify(body),
            headers: { 'Content-Type': 'application/json' },
        }).then(res => res.json()).then(function (data) {
            returned = data.json();
            console.log(returned);  //expecting array
            res.redirect("http://tutuguerra.com.br/home", 200)//callback(null, 200, req);
            //res.render('./personal/index.jade', { JSON.stringify(returned) });
        });
    }
);

module.exports = router;