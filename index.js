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
    maxAge: 1000*60*60*24,
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

app.post('/api/user',passport.authenticate('registration',{
    //successRedirect:'/signIn',
    failureRedirect: '/api/error',
    failureFlash: true
}), function (req, res){
    res.send( {message: "Registration"})
})

app.post('/api/add',passport.authenticate('cookie-session',{
    failureRedirect: '/api/error',
    failureFlash: true
}), (req,res)=>{
    db.CreateNewTest(req.body.title,req.body.time,req.body.count).then(test=>{
        db.CreateNewQuestion(test.id,req.body.questions,req.body.answers).then(()=>{
            res.send({message: "Test saved"})
        })
    })
})

app.post('/api/login', passport.authenticate('authentication',{
    failureRedirect: '/api/error',
    failureFlash: true
}), function (req, res){
    res.send({ message: "You auth user"})
})

app.post('/api/test/:id',passport.authenticate('cookie-session',{
    failureRedirect: '/api/error',
    failureFlash: true
}), async (req,res)=>{
    let counter = 0;
    let test = await db.FindTestById(req.params.id)
    let data = await db.FindQuestionsByIdTest(test.id)
    let foundResult = await db.FindResult(req.user.id,test.id);
        if( foundResult[0] !== undefined && foundResult[0] !== null){
            db.FindResultById(req.user.id,test.id,foundResult[0].attempt).then((result)=>{
                for (let i = 0; i < test.count; i++){
                    if(req.body.userAnswers[i].answer === data.answers[i].answer){
                        counter++;
                    }
                }
                let newAttempt = result.attempt + 1;
                db.CreateNewResult(req.user.id,test.id,Math.round(counter * 100 / test.count),newAttempt,test.title).then(()=>{
                    res.send({message:"Answers saved"})
                }).catch(e =>{
                    res.send({message:"Error: Saving result"})
                })
            })
        }else{
            for (let i = 0; i < test.count; i++){
                if(req.body.userAnswers[i].answer === data.answers[i].answer){
                    counter++;
                }
            }
            db.CreateNewResult(req.user.id,test.id,Math.round(counter * 100 / test.count),1, test.title).then(()=>{
                res.send({message:"Answers saved"})
            }).catch(e =>{
                res.send({message:"Error: Saving result"})
            })
            }
    }
)

app.get('/api/error',(req, res)=>{
    res.send({message: req.flash('error')})
})

app.get('/api/tests',passport.authenticate('cookie-session',{
    failureRedirect:'/api/error',
    failureFlash:true
}), async (req,res)=>{
    res.send(JSON.stringify(await db.FindAllTests()))
})

app.get('/api/test/:id',passport.authenticate('cookie-session',{
    failureRedirect:'/api/error',
    failureFlash:true
}), async (req,res)=>{
        let test = await db.FindTestById(req.params.id)
        let question = await db.FindQuestionsByIdTest(req.params.id);
        res.send({
            id: test.id,
            title: test.title,
            time: test.time,
            count: test.count,
            questions: question.questions
        })
})

/*
app.get('/api/account',passport.authenticate('cookie-session', {
    failureRedirect: '/signIn',
    failureFlash: {message: "You should authorize" }
}), function (req, res) {
    res.render('account.hbs',{
        login: req.user.login,
        email: req.user.email
    })
});*/

///////////CRUD/////////////

app.get('/api/user', passport.authenticate('cookie-session', {
    failureFlash: {message: "You should authorize to access this page"}
}), async function (req, res) {
    let results = (await db.FindAllResultOfUser(req.user.id))
    let user = await db.FindById(req.user.id)
    console.log(results)
    res.send({
        login: user.login,
        email: user.email,
        results: results
    })
    /*
    if (req.user.login === "Nastya")
    {
        if(req.query.all)
        {
            res.send(JSON.stringify(await db.FindAll()))
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
    }*/
})

app.put('/api/user', passport.authenticate('cookie-session', {
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


app.delete('/api/user', passport.authenticate('cookie-session', {
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
