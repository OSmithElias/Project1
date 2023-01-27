// This file is used ot interact with the DynamoDb Users table

const AWS= require('aws-sdk');// Used to access data base in DynamoDB
const app =require('express');// Used to access express.js 

AWS.config.update({
    region: "us-east-1",// adding my region because my database/tables only exist in my region
})

const docClient = new AWS.DynamoDB.DocumentClient(); // Creating an instance to use to access different Dynamo methods


function getUserByUsername(username){
    params = {
        TableName: "Users",
        Key: {
            username,
        }
    };

    
    return docClient.get(params).promise();
    /*
    , function(err,data){
        if(err){
            console.error(`Unable to find ${username}`)
        }else{
            console.log(data.Item)
        }
    });
    */
}

module.exports= {
    getUserByUsername,
}

//getUserByUsername("admin123")
//console.log()