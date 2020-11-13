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
const db = require('./sequelize')
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

/*
app.get('/',function(request,response){
    response.render("home.hbs", {
        title: title,
        information: "Welcome to the club!",
        description: "Serves without any tasks"
    })
})*/

/* ---
app.get('/registration',function (req,res){
    res.render('registration.hbs',{
        path: "/registration",
        errorMessage: req.flash('error')
    })
    //console.log(req.flash());
})*/

//app.post('/registration',passport.authenticate('registration',{
app.post('/user',passport.authenticate('registration',{
    //successRedirect:'/signIn',
    //failureRedirect: '/registration',
    failureFlash: true
}), function (req, res){
    res.send( {message: "Registration"})
})

// app.post('/user', function (req, res){
//     console.log(req.body);
//     res.send( {lox: true})
// })

/*
app.get('/signIn',function(req,res){
    res.render('signIn.hbs',{
        path: '/signIn',
        errorMessage: req.flash('error')
    })
})*/

app.post('/signIn', passport.authenticate('authentication',{
    //successRedirect: '/',
    //failureRedirect: '/signIn',
    failureFlash: true
}), function (req, res){
    res.send({ message: "You auth user"})
})

/*
app.get('/account',passport.authenticate('cookie-session', {
    failureRedirect: '/signIn',
    failureFlash: {message: "You should authorize" }
}), function (req, res) {
    res.render('account.hbs',{
        login: req.user.login,
        email: req.user.email
    })
});*/

///////////CRUD/////////////

app.get('/user', passport.authenticate('cookie-session', {
    failureFlash: {message: "You should authorize to access this page"}
}), async function (req, res) {
    if (req.user.login === "Nastya")
    {
        if(req.query.all)
        {
            //res.send({id: req.user.id,login: req.user.login, email: req.user.email});
            res.send(await db.FindAll())
        }
        if(req.query.name)
        {
            db.FindByLogin(req.query.name).then(user => {
                res.send({id:user.id, login: user.login, email:user.email})
            })
        }
        else{
            res.send({message: "Nothing"})
        }
    }
    else{
        res.send({id: req.user.id,login: req.user.login, email: req.user.email});
    }
    /*
    if (req.user.login == "Nastya")
    {
        if(req.query.all == "10")
        {
            res.send(db.FindAll())
        }
        if(req.query.id !== undefined)
        {
            db.FindById(req.query.id).then(user => {
                if (user !== undefined)
                {
                    res.send({id: req.query.id, login: user.login, email: user.email})
                }
                else{
                    res.send({lox: false})
                }
            })
        }
        else{
            res.send({id: req.user.id, login: req.user.login, email: req.user.email})
        }
    }
    else{
        res.send({id: req.user.id, login: req.user.login, email: req.user.email})
    }*/
    //res.send({lox: true, who: req.user.login});
})

/* it/s work
app.put('/user', passport.authenticate('cookie-session', {
    //failureRedirect: '/login',
    failureFlash: {message: "You should authorize to access this page"}
}), async function (req, res) {
    res.send(await db.UpdateData(req.user.login,req.body));
})*/


app.put('/user', passport.authenticate('cookie-session', {
    //failureRedirect: '/login',
    failureFlash: {message: "You should authorize to access this page"}
}), async function (req, res) {
    if (req.user.login === "Nastya")
    {
        if(req.body)
        {
            db.FindByLogin(req.body.name).then(user => { //find by name -> login
                res.send(db.UpdateData(user.login, req.body))
            })
        }
        else{
            res.send({message: "Nothing"})
        }
    }
    else{
        if(req.body){
            db.FindByLogin(req.user.login).then(user =>{
                res.send(db.UpdateData(user.login, req.body))
            })
        }
    }
    //res.send(await db.UpdateData(req.user.login,req.body));
})


app.delete('/user', passport.authenticate('cookie-session', {
    //failureRedirect: '/signIn',     //'/login', --
    failureFlash: {message: "You should authorize to access this page"}
}), function (req, res) {
    if(req.user.login === "Nastya"){
        //if(req.query.id){
            db.FindByLogin(req.query.login).then(user => {
                if (user !== undefined && user !== null)
                {
                    db.DeleteUserByName(req.query.login).then(u =>
                        res.send({message:"Success delete"})
                    ).catch(e =>
                            res.send({lox:true,message:e.toString()}))
                }
                else
                    res.send({message:"User not found"})
            }).catch(e => res.send({lox:true,message:e.toString()}));
        //}
    } else
        res.send({lox:true,message:"Only for admins"});

});



//дополнительный обработчик ошибок для 404
app.use((req, res, next) => {
    next(new Error('404'))
})

//app.use(LogError);

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
            res.send({lox: false, wtf: true})
            /*
            res.render("errors.hbs", {
                title: title,
                tit: "ERROR:",
                errorStatus: 403,
                errorMessage: "Incorrect data entered!"
            });*/
            break;
        case '403_Access':
            res.send({lox: false, wtf: true})
            /*
            res.render("errors.hbs", {
                title:title,
                tit: "ERROR:",
                errorStatus: 403,
                errorMessage: "You don't have access"
            });*/
            break;
        case '404':
            res.send({lox: false, wtf: true})
            /*
            res.render("errors.hbs", {
                title: title,
                tit: "ERROR:",
                errorStatus: 404,
                errorMessage: "This page does not exist"
            });*/
            break;
        default:
            res.send({lox: false, wtf: true})
            /*
            res.render("errors.hbs", {
                title: title,
                tit: "ERROR:",
                errorStatus: 500,
                errorMessage: "Internal Server Error"
            });*/
    }
    let CurrentDate = new Date();
    let Url = req.url
    let Log = `Error: ${err.message} -- ${CurrentDate} ${Url} `;

    fs.appendFile("LogErrors.txt",Log + '\n',function(err){
        if (err) throw err;
        console.log("File recording is complete.")
    })
}
