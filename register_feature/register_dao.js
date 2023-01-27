// Useed to access database 
// Need body parser to parse through requestbody
// need AWS Document Client 

AWS=require('aws-sdk');//used to acess DynamoDB 

AWS.config.update({

    region:"us-east-1", // Need to specify what region to access my tables 

})

const docClient= new AWS.DynamoDB.DocumentClient();

function authorizeRegistration(username,password){
    params = {
        TableName: "Users",
        Item: {
            "username": username,
            "password": password,
            "role": "reg_employee"
        }
    }

    return docClient.put(params,(err,data)=>{
        if(data){
            console.log("Registration Successful")
        }else if(err){
            console.log("Registration Unsuccessful")
            console.log(err)
        }
           

    })
}

module.exports={
    authorizeRegistration,

}
