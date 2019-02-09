const GoogleStrategy = require('passport-google-oauth20').Strategy;
const { googleCredentials } = require('../secrets/config');
const db = require('../wrappers/db');
const pool = db.getPool();
const crypto = require('crypto');

module.exports = (passport) => {

    passport.serializeUser((user, cb) => cb(null, user))
    passport.deserializeUser((obj, cb) => cb(null, obj))
    const callback = (accessToken, refreshToken, profile, cb) => cb(null, profile)

    let queryFindUser = `SELECT id from users where email like ($1) `;
    let queryInsertUser = `INSERT INTO users(name,password,email,hashtoken,admin) VALUES ($1,$2,$3,$4,$5) RETURNING id`;

    passport.use(new GoogleStrategy({
        clientID: googleCredentials.API_KEY,
        clientSecret: googleCredentials.API_SECRET,
        callbackURL: googleCredentials.API_CALLBACK
        //}, callback));
    }, (acessToken, refreshToken, profile, cb) => {
        let passwordGoogle = crypto.createHash('sha512').update(profile.id).digest('hex');
        let newUser = { name: profile.name.givenName, password: passwordGoogle, email: profile.emails[0].value, hashtoken: profile.id, admin: false };

        pool.query(queryFindUser, [newUser.email]).then(result => {
            const { rows } = result;
            if (rows.length > 0) return cb(null, profile);

            pool.query(queryInsertUser, [newUser.name, newUser.password, newUser.email, newUser.hashtoken, newUser.admin]).then(res => {
                if (res.rowCount > 0)
                    return cb(null, profile);
            })
        }).catch((err) => { return cb(err, 500); });
    }));
}

//ACESSTOKEN: ya29.GlygBmIP9LdznXHrxaQSegi-YTvb4m8WaNO740LwTUMLffJFHGFEigGWUZKWwx0UFJfWO84SFdRhgOMhAOXtuW4JLwCCOUjRHLK3BKa9hc8TnBTO0FjDxfEwfmR62A
//REFRESHTOKEN: undefined
//PROFILE: { id: '107754945436597422204',
//   displayName: 'Victor caciquinho',
//   name: { familyName: 'caciquinho', givenName: 'Victor' },
//   photos:
//    [ { value:
//         'https://lh5.googleusercontent.com/-_EAWq9UR0Sc/AAAAAAAAAAI/AAAAAAAAAAA/ACevoQMIykLUwibcUP9W7EvRsuEsddfUfg/mo/photo.jpg?sz=50' } ],
//   gender: 'male',
//   provider: 'google',
//   _raw:
//    '{\n "kind": "plus#person",\n "etag": "\\"jb1Xzanox6i8Zyse4DcYD8sZqy0/6JfjV-5_5CZ-IHDixR9UyssfLtQ\\"",
//     \n "gender": "male",\n "objectType": "person",\n "id": "107754945436597422204",\n 
//     "displayName": "Victor caciquinho",\n "name": {\n  "familyName": "caciquinho",\n
//     "givenName": "Victor"\n },\n "url": "https://plus.google.com/107754945436597422204",
//      \n "image": {\n  "url": "https://lh5.googleusercontent.com/-_EAWq9UR0Sc/AAAAAAAAAAI/AAAAAAAAAAA/ACevoQMIykLUwibcUP9W7EvRsuEsddfUfg/mo/photo.jpg?sz=50",
//      \n  "isDefault": true\n },\n "isPlusUser": true,\n "language": "pt_BR",\n "circledByCount": 0,\n "verified": false\n}\n',
//   _json:
//    { kind: 'plus#person',
//      etag: '"jb1Xzanox6i8Zyse4DcYD8sZqy0/6JfjV-5_5CZ-IHDixR9UyssfLtQ"',
//      gender: 'male',
//      objectType: 'person',
//      id: '107754945436597422204',
//      displayName: 'Victor caciquinho',
//      name: { familyName: 'caciquinho', givenName: 'Victor' },
//      url: 'https://plus.google.com/107754945436597422204',
//      image:
//       { url:
//          'https://lh5.googleusercontent.com/-_EAWq9UR0Sc/AAAAAAAAAAI/AAAAAAAAAAA/ACevoQMIykLUwibcUP9W7EvRsuEsddfUfg/mo/photo.jpg?sz=50',
//         isDefault: true },
//      isPlusUser: true,
//      language: 'pt_BR',
//      circledByCount: 0,
//      verified: false } }
// CB: [Function: verified]
