'use strict';
const express = require("express");
const fs = require('fs');
const app = express()
const PORT = 3000;
const bodyParser = require('body-parser')
const hbs = require('hbs')
const flash = require('connect-flash')
const passport = require("./passportJS").passport
const cookieSession = require('cookie-session')
const cookieParser  = require('cookie-parser')
const Connection = require("./sequelize").Connection
require('passport-local');

const title = "Web Program"

app.set("view engine", "hbs");//
hbs.registerPartials("./views/partials/")//
app.use(express.static("public"));//

app.use(flash());           //управление сообщения на flash
                            // эти сообщения сохраняются в сессии,нужно для ошибок в регистраци и логине
                            //Сессия - промежуток времени, в теч которого пользователь находится на сайте

app.use(cookieSession({
    name: "session",        //по умолчанию
    keys: ['key1','key2'],    //Список ключей, используемых для подписи и проверки значений файлов cookie
    maxAge: 900000,
    secure: false,//логическое значение, указывающее, должен ли cookie пересылаться только по HTTPS
    signed: true//логическое значение, указывающее, должен ли быть подписан файл cookie
}));
app.use(cookieParser());

app.use(bodyParser.json())  //для обработки post запросов
                            // извлекает всю часть тела вход потока запросов
app.use(bodyParser.urlencoded({extended: true}))

app.use(passport.initialize()); //аутентификация для nodejs
app.use(passport.session());    //If your application uses persistent login sessions,
                                // passport.session() middleware must also be used.
app.use(LoggingToConsole);

app.get('/registration',function (req,res){
    res.render('registration.hbs',{
        path: "/registration",
        errorMessage: req.flash('error')
    })
    //console.log(req.flash());
})

app.post('/registration',passport.authenticate('registration',{
    successRedirect:'/signIn',
    failureRedirect: '/registration',
    failureFlash: true
}))

app.get('/signIn',function(req,res){
    res.render('signIn.hbs',{
        path: '/signIn',
        errorMessage: req.flash('error')
    })
})

app.post('/signIn', passport.authenticate('authentication',{
    successRedirect: '/',
    failureRedirect: '/signIn',
    failureFlash: true
}))

app.get('/',function(request,response){
    response.render("home.hbs", {
        title: title,
        information: "Welcome to the club!",
        description: "Serves without any tasks"
    })
})

app.get('/account',passport.authenticate('cookie-session', {
    failureRedirect: '/signIn',
    failureFlash: {message: "You should authorize" }
}), function (req, res) {
    res.render('account.hbs',{
        login: req.user.login,
        email: req.user.email
    })
});

//дополнительный обработчик ошибок для 404
app.use((req, res, next) => {
    next(new Error('404'))
})

app.use(LogError);

app.listen(PORT,()=>{
    console.log("Server started at", PORT)
    Connection().then(()=>{
        console.log('connected database');
    }).catch((err) =>{
        console.log(err)
    })
});

function LoggingToConsole(req,res,next) {
    let CurrentDate = new Date();
    let FormattedDate =
        CurrentDate.getFullYear() +
        "-" +
        CurrentDate.getMonth() +
        "-" +
        CurrentDate.getDate() +
        " " +
        CurrentDate.getHours() +
        ":" +
        CurrentDate.getMinutes() +
        ":" +
        CurrentDate.getSeconds();
    let Method = req.method
    let Url = req.url
    let Log = `[${FormattedDate}] ${Method} ${Url} `; //` - brace
    console.log(Log);
    next();
}

function LogError(err,req,res,next) {
    switch (err.message){
        case '403_WrongValue':
            res.render("errors.hbs", {
                title: title,
                tit: "ERROR:",
                errorStatus: 403,
                errorMessage: "Incorrect data entered!"
            });
            break;
        case '403_Access':
            res.render("errors.hbs", {
                title:title,
                tit: "ERROR:",
                errorStatus: 403,
                errorMessage: "You don't have access"
            });
            break;
        case '404':
            res.render("errors.hbs", {
                title: title,
                tit: "ERROR:",
                errorStatus: 404,
                errorMessage: "This page does not exist"
            });
            break;
        default:
            res.render("errors.hbs", {
                title: title,
                tit: "ERROR:",
                errorStatus: 500,
                errorMessage: "Internal Server Error"
            });
    }
    let CurrentDate = new Date();
    let Url = req.url
    let Log = `Error: ${err.message} -- ${CurrentDate} ${Url} `;

    fs.appendFile("LogErrors.txt",Log + '\n',function(err){
        if (err) throw err;
        console.log("File recording is complete.")
    })
}

