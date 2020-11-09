const passport = require('passport')
const LocalStrategy = require('passport-local').Strategy
const CookieStrategy = require('passport-cookie').Strategy
const argon2 = require('argon2')

//const Connection = require("./sequelize").Connection

const User = require("./sequelize").User //???

const CreateNewUser = require('./sequelize').CreateNewUser;
const GetPassword = require('./sequelize').GetPassword;
const FindById = require('./sequelize').FindById;
const FindByLogin = require('./sequelize').FindByLogin


// http://www.passportjs.org/docs/username-password/
passport.use('authentication' ,new LocalStrategy({
        usernameField: 'login',
        passwordField: 'password',
        passReqToCallback: true
    }, function(req, login, password, done) {
    FindByLogin(login).then(user => {
        if (user !== undefined && user !== null) {

            GetPassword(login).then(HashPass => {

                argon2.verify(HashPass, password).then(result => {
                    if (result) {
                        return done(null, user);//all is ok
                    }
                    return done(null, false, {message: "ERROR: Invalid password"})
                }).catch(err => {
                    return done(null, false, { message: "ERROR: " + err})
                })
            }).catch(err => {
                return done(null, false, {message: "Error " + err})
            })
        } else {       // user is not found
            return done(null, false, {message: "ERROR: Invalid login"})
        }
    }).catch(err => {
            return done(null, false, {message: "ERROR: " + err})
        }
    )
}))

//https://stackoverflow.com/questions/47457006/register-user-through-passport-js
passport.use('registration', new LocalStrategy({
    usernameField: 'login',
    passwordField: 'password',
    passReqToCallback: true
}, function (req, login,password,done) {
    FindByLogin(login).then(user => {
        if (user) {
            return done(null, false, {message: "ERROR: This name is already taken"})
        } else {
            CreateNewUser(login, req.body.email, password).then(NewUser => {
                return done(null, NewUser);
            }).catch(err => {
                return done(null, false, {message: "ERROR: " + err})
            })
        }
    }).catch(err => {
        return done(null, false, {message: "ERROR: " + err})
    })
}))

passport.use('cookie-session',new CookieStrategy({
    cookieName: 'session',
    passReqToCallback: true
}, function (req,session,done){
   if (!req.user){
       return done(null, false, {message: "ERROR: You doesn't authorize"})
   }
   FindByLogin(req.user.login).then(user => {
       if (user !== undefined && user !== null) {
           return done(null, user);
       } else {
           return done(null, false, {message: "ERROR: You doesn't authorize"})
       }
   }).catch(err =>{
       return done(null, false, {message: "ERROR: " + err})
   })
}))

/*Сериализация
Сериализация используется для передачи объектов по сети
и для сохранения их в файлы
*/

passport.serializeUser(function(user, done) {
    done(null, user.id); //хранение пользовательского id
});

passport.deserializeUser(function (id, done){
    FindById(id).then(user=> {
        done(null, user); //пользователя нет =>
        // аутентификации нет
    });
});

module.exports.passport = passport