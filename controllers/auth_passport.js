const GoogleStrategy = require('passport-google-oauth20').Strategy;
const config = require('../secrets/config');

module.exports = (passport) => {
    passport.serializeUser((user, done) => {
        done(null, user);
    });

    passport.deserializeUser((user, done) => {
        done(null, user);
    });

    passport.use(new GoogleStrategy({
        clientID: config.googleCredentials.API_KEY,
        clientSecret: config.googleCredentials.API_SECRET,
        callbackURL: config.googleCredentials.API_CALLBACK
    }, (acessToken, refreshToken, profile, cb) => {
        // User.findOrCreate({ googleId: profile.id }, function (err, user) {
        //     return cb(err, user);
        // });
        console.log(acessToken)
        console.log(refreshToken)
        console.log(profile)
        console.log(cb)
    }));
}
