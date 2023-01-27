// adding the function to creat a jsonwebtoken

const jwt= require('jsonwebtoken');
const Promise = require('bluebird');

function createJWT(username,role){
    return jwt.sign({
        username,
        role
    }, 'secretSignature', {
        expiresIn: '1d'
    })
}

function  verifyTokenAndReturnPayload(token){

    jwt.verify = Promise.promisify(jwt.verify);// Turns jwt.verify into a function that returns a promise

    return jwt.verify(token,'secretSignature');
}

module.exports= {
    createJWT,
    verifyTokenAndReturnPayload


}