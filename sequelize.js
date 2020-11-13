const { Sequelize } = require('sequelize');
const param = require('./config/config.json').development
const argon2 = require('argon2');

// passing parameters
const sequelize = new Sequelize(param.database,param.username,param.password, {
    host:"db",
    dialect: "postgres"
})
const ModelOfUser = require("./models/user")(sequelize, Sequelize);



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


//async function UpdateData(req, res, next) {
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
    console.log("FIND ALL")
    let users = await ModelOfUser.findAll();
    console.log(users)
    //return await ModelOfUser.findAll();
    return users
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