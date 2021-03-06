const { Sequelize } = require('sequelize');
const param = require('./config/config.json').development
const argon2 = require('argon2');

// passing parameters
const sequelize = new Sequelize(param.database,param.username,param.password, {
    host:"db",
    dialect: "postgres"
})
const ModelOfUser = require("./models/user")(sequelize, Sequelize);
const ModelOfTest = require('./models/test')(sequelize, Sequelize);
const ModelOfQuestion = require('./models/question')(sequelize,Sequelize);
const ModelOfResult = require('./models/testresult')(sequelize,Sequelize)

//testing the connection
async function Connection() {
    try{
        await sequelize.authenticate();
        console.log('Connection has been established successfully.');
    } catch (error){
        console.error('Unable to connect to the database',error);
    }
}

async function GetPassword(login) {
    let user = await FindByLogin(login);
    return user.password;
}

async function FindByLogin(login) {
    return await ModelOfUser.findOne({
        where: {
            login: login
        }
    });
}

async function FindById(id) {
    return await ModelOfUser.findOne({
        where: {
            id: id
        }
    });
}

async function FindTestByTitle(title){
    return await ModelOfTest.findOne({
        where:{
            title: title
        }
    })
}

async function CreateNewUser(login, email, password){
    const HashPass = await argon2.hash(password);

    let newUser = ModelOfUser.build({
        login: login,
        email: email,
        password: HashPass
    });
    console.log("Saved to BD");
    return await newUser.save();
}

async function CreateNewTest(title, time, count){
    let newTest = ModelOfTest.build({
        title: title,
        time: time,
        count: count
    })
    console.log("Saved test")
    return await newTest.save();
}

async function CreateNewQuestion(id,questions,answers){
    let newQuestion = ModelOfQuestion.build({
        testId: id,
        questions: questions,
        answers: answers
    })
    console.log("Saved questions")
    return await newQuestion.save();
}

async function CreateNewResult(userId,testId,grade,attempt,title){
    let newResult = ModelOfResult.build({
        testId: testId,
        userId: userId,
        grade: grade,
        attempt: attempt,
        testTitle: title
    })
    console.log("Saved result")
    return await newResult.save()
}

async function UpdateData(login,body) {
    let user = await FindByLogin(login);
    console.log("FINDED")
    if (body.email) {
    //if (user.email){
        console.log("Changing email");
        user.email = body.email;
        user = await user.save();
    }
    if (body.login){
        console.log("Changing login")
        user.login = body.login;
        user = await user.save();
    }
    if (body.password) {
        console.log("Changing password")
        const HashPass = await argon2.hash(body.password);
        user.password = HashPass;
        user = await user.save();
    }
    return user;
}

async function FindAll(){
    let users = await ModelOfUser.findAll();
    console.log(users)
    //return await ModelOfUser.findAll();
    return users
}

async function FindAllTests(){
    return await ModelOfTest.findAll();
}

async function FindTestById(id){
    return await ModelOfTest.findOne({
        where:{
            id: id
        }
    })
}

async function FindQuestionsByIdTest(id){
    return await ModelOfQuestion.findOne({
        where: {
            testId: id
        }
    })
}

async function FindResult(userId,testId){
    return await ModelOfResult.findAll({
        limit:1,
        where:{
            testId:testId,
            userId: userId
        },
        order:[['createdAt','DESC']]
    })
}

async function FindResultById(userId,testId,attempt){
    return await ModelOfResult.findOne({
        where:{
            testId:testId,
            userId: userId,
            attempt: attempt
        }
    })
}

async function FindAllResultOfUser(userId){
    return await ModelOfResult.findAll({
        where:{
            userId: userId
        },
        raw:true
    })
}

async function DeleteUserByName(login){
    let user = await FindByLogin(login)
    await user.destroy();
}

exports.Connection = Connection;
exports.sequelize = sequelize;
exports.FindByLogin = FindByLogin;
exports.GetPassword = GetPassword;
exports.User = ModelOfUser;
exports.CreateNewUser = CreateNewUser;
exports.FindById = FindById;
exports.UpdateData = UpdateData
exports.DeleteUserByName = DeleteUserByName
exports.FindAll = FindAll
exports.CreateNewTest = CreateNewTest
exports.CreateNewQuestion = CreateNewQuestion
exports.FindAllTests = FindAllTests
exports.FindTestById = FindTestById
exports.FindQuestionsByIdTest = FindQuestionsByIdTest
exports.FindResult = FindResult
exports.FindResultById = FindResultById
exports.CreateNewResult = CreateNewResult
exports.FindAllResultOfUser = FindAllResultOfUser