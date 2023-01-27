const AWS= require('aws-sdk');// Used to access data base in DynamoDB
const express =require('express');// Used to access express.js 
const {getUserByUsername} = require("./userdao"); // inporting the funciton from file user dao
const {verifyTokenAndReturnPayload,createJWT}= require("./jwtfunction")
const bodyParser= require('body-parser')// Used to parse the body of requests  received by clients
const {authorizeRegistration} = require('../register_feature/register_dao');
const {ticketSubmission, retrieveTicket,allTickets, retrieveReimbursementByStatus,retrieveReimbursementByUsername, updateStatusById} = require('../reimbursement_tickets_feature/ticketdao');
const { DocumentClient } = require('aws-sdk/clients/dynamodb');
AWS.config.update({
    region: "us-east-1",// adding my region because my database/tables only exist in my region
})

PORT=3000;
app= express();
app.use(bodyParser.json())// used to parse through the json format body


app.listen(3000,()=>{//created a server and listen is letting the us as users know the server is listening on port 3000
    console.log(`listening on port ${PORT}`)
})
//const DynamoDB = new AWS.DynamoDB(); // Creating an instance to access different Dynamo methods

/**
 * app is used to repersent express framework for building REST APIs
 * post is a verb to let us know the data is being submitted 
 * './login is the endpoint 
 *  req is the request being sent
 * res is the information sent back
 */
app.post('/login', async (req,res)=>{
    const username = req.body.username; // parses the request body to find the username 
    const password = req.body.password;// parses the request body to find the password

    const data= await getUserByUsername(username)// takes username from the request as input 
    const userItem= data.Item // returns data for the item in the table
   
   
    if(userItem){
        if(userItem.password===password){// This is used to compare the password give by the user and the password in the database
           // If login is successful then create a JWT for user

            const token = createJWT(userItem.username,userItem.role)//create a jsonwebtoken  for the user

            res.send ({
                "message":"Account Authenicated",
                "token": token
            })

        }else{
            res.statusCode=400;
            res.send({
                "message":"invalid password"
            })
        }
    }else{
        res.statusCode=400;
        res.send({
            "Message": `user ${username} not found`
        });
    };
    
});


////// Need to very if the person thats logged in is a employee or a finance manager 

app.get('/employeeverified', async (req, res) => {
    
    const token= req.headers.authorization.split(' ')[1]; // within the token we recieve an array and the fist element is not needed which is why we use index 1

    try {
        const payload = await verifyTokenAndReturnPayload(token);

        if (payload.role==='reg_employee'){
            res.send({
                "message": `Welcome, user ${payload.username}`
                
            })
        }else{
            res.statusCode =401;
            res.send({
                "message":`You are not a regular user. You are a ${payload.role}`
            })
        }

    }catch(err){// failed to verify token
        res.statusCode=401;
        res.send({
            "message":`Token verification failure`
        })

    }
})

app.get('/adminverified', async (req,res)=>{

    const token = req.headers.authorization.split(' ')[1];//

    try{
        const payload = await verifyTokenAndReturnPayload(token);

        if (payload.role ==='admin'){
            res.send({
                "message":`Welcome ,  ${payload.username}`
            })
        }else{
            res.statusCode= 401;
            res.send({
                "message": `You are not an admin user.You are a ${payload.role}`
            })
        }
    }catch(err){
        res.statusCode=401
        res.send({
            "message": "Token not verified "
        })

    }
    
})

////////////////////////////////////////////////////////////////////////////////////
// Registration

app.post('/Register', async (req,res)=>{
    const username = req.body.username;
    const password = req.body.password;


    const data = await getUserByUsername(username)
    const userItem = data.Item;

    
    if (userItem){
        res.send({
            "message": `Invalid user, username ${username} is already in use`
        })
    }else{
        const data = await authorizeRegistration(username,password);

        if(data){
            res.send({
                "message": `${username} registration Successful`
            })
        }else{
            res.statusCode=401,
            res.send({ 
                "message": `Registration failed`
            })
           
            
        }
    }
})


/////////////////////////////////////////////////////////////////////////////////////////
// Submit reimbursement ticket

app.post("/submitreimbursements", async (req,res)=>{
    const token = req.headers.authorization.split(" ")[1];
    const amount= req.body.amount;
    const description= req.body.description

    payload= await verifyTokenAndReturnPayload(token);

    const username=payload.username;
    const role=payload.role;
    //const data1= await retrieveTicket()
    const data= await ticketSubmission(amount,description,username);
    if(data&&role=="reg_employee"){
         res.send({
            "message":`Ticket reimbursement processing`,
            })
    }else{
            res.statusCode=401

        }

    }

)
////////////////////////////////////////////////////////////////////
// get ticket based on the reimbursement id
app.get("/reimbursements/:id", async (req,res)=>{
    const reimbursement_id=req.body.reimbursement_id

    try{
        let data = await retrieveTicket(reimbursement_id)

        if(data.Item){
            res.statusCode=200
            res.send(data.Item)
        }else{
            res.statusCode=400
            res.send({
                "message" : `Ticket ${reimbursement_id} does not exist`
            })

        }
    }catch(err){
        res.statusCode=500
        res.send({
            "message":err
        })
    }

})

////////////////////////////////////////////////////
// Manager acces all tickets 

app.get("/allReimbursements" , async (req,res)=>{
    const token= req.headers.authorization.split(" ")[1];
    try{
        const payload = await verifyTokenAndReturnPayload(token);
        const role = payload.role;

        if(role=="admin"){
            let data= await allTickets()
            res.send(data.Items)
        }else{
            res.send({
                "message":`Unauthorized user ${role} can't view full list of Reimbursements`
            })
        }
    }catch{
        res.statusCode=500
        res.send({
            "message": "Invalid token"
        })
    }
    
    
    

})

///////////////////////////////////////////////////
//Get ticket based on status

app.get('/reimbursementstatus', async (req, res) => {
    const token= req.headers.authorization.split(" ")[1];
    let status = req.body.status
    try {
        const payload = await verifyTokenAndReturnPayload(token);
        const role = payload.role;

        if (status && role=="admin") {
            let data = await retrieveReimbursementByStatus(status);
            res.send(data.Items);
        } else {
            res.statusCode=500
           
        }
    } catch(err) {
        res.statusCode = 500;
        res.send({
            "message": err
        });
    }
})
//////////////////////////////////////////////////////////////
// Get ticket based on username


app.get('/reimbursementsbyuser', async (req, res) => {
    const token= req.headers.authorization.split(" ")[1];
    
    try {
        payload = await verifyTokenAndReturnPayload(token);
        let username = payload.username

        if (username) {
            let data = await retrieveReimbursementByUsername(username);
            res.send(data.Items);
        } else {
            res.statusCode=500
           
        }
    } catch(err) {
        res.statusCode = 500;
        res.send({
            "message": err
        });
    }
})

////////////////////////////////////////////////////////////////////
// Update Status of ticket by id
app.patch('/reimbursements/:id/status', async (req, res) => {
    const token= req.headers.authorization.split(" ")[1];
    const newStatus = req.body.newStatus;
    const reimbursement_id= req.body.reimbursement_id


    try {

        payload = await verifyTokenAndReturnPayload(token);
        const role = payload.role
        const data = await retrieveTicket(reimbursement_id);
        const userItem= data.Item;
        const status= userItem.status

        if(role=="admin"&& status=="pending"){
            
            if (userItem) {
                await updateStatusById(reimbursement_id, newStatus);
                res.send({
                    "message": `Successfully updated status of item with id ${reimbursement_id}`
                });
            } else {
                res.statusCode = 404;
                res.send({
                    "message": `Item does not exist with id ${reimbursement_id}`
                });
            }
        }else{}
       
    } catch (err) {
        res.statusCode = 500;
        res.send({
            "message": err
        });
    }
})