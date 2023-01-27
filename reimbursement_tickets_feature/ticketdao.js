//Submit reimbursement ticket
const uuid = require('uuid');
AWS=require('aws-sdk');

AWS.config.update({
    region: "us-east-1",
})

const { AmplifyUIBuilder } = require("aws-sdk");

const docClient= new AWS.DynamoDB.DocumentClient();

function ticketSubmission(amount,description, username){
    params= {
        TableName: "Reimbursements",
        Item: {
            "reimbursement_id": uuid.v4(),
            amount,
            status: "pending",
            description,
            username,
            
            

        }
    }
    return docClient.put(params).promise()

}

module.exports= {
    ticketSubmission,
    retrieveTicket,
    allTickets,
    retrieveReimbursementByStatus,
    retrieveReimbursementByUsername,
    updateStatusById
}

//ticketSubmission(10.75,"yer","badmon")

//////////////////////////////////////////////////////////////////

//Retrieve Ticket by reimbursement Id

function retrieveTicket(reimbursement_id){ //gets the data from aws table
    params = {
        TableName: "Reimbursements",
        Key: {
            reimbursement_id,
        }
    }
     
    
    return docClient.get(params).promise()
    
        
}


async function getTicket(reimbursement_id){//unpacks the data from aws table

    data = await retrieveTicket(reimbursement_id)
    //console.log(data)
    //return data
}

//data= await retrieveTicket("decb28ce-48f1-4b0f-a47c-521877dd4468")


//getTicket("decb28ce-48f1-4b0f-a47c-521877dd4468")




/*
function updateTicketStatus(reimbursement_id){

}
*/

function allTickets(){
    params= {
        TableName: "Reimbursements"
    }

    return docClient.scan(params).promise()

    
}

// async function tickets() {

//     let data= await allTickets()
//     console.log(data)

// }

// tickets()

function retrieveReimbursementByStatus(status) {
    const params = {
        TableName: 'Reimbursements',
        IndexName: 'status-index',
        KeyConditionExpression: '#c = :value',
        ExpressionAttributeNames: {
            '#c': 'status'
        },
        ExpressionAttributeValues: {
            ':value': status
        }
    };

    return docClient.query(params).promise();

}


// async function viewStatus(status){
//     let data= await retrieveReimbursementByStatus(status)
//     console.log(data.Items)
// }

// viewStatus("pending")

function retrieveReimbursementByUsername(username) {
    const params = {
        TableName: 'Reimbursements',
        IndexName: 'username-index',
        KeyConditionExpression: '#c = :value',
        ExpressionAttributeNames: {
            '#c': 'username'
        },
        ExpressionAttributeValues: {
            ':value': username
        }
    };

    return docClient.query(params).promise();

}

function updateStatusById(reimbursement_id, newStatus) {
    const params = {
        TableName: 'Reimbursements',
        Key: {
            reimbursement_id
        },
        UpdateExpression: 'set #n = :value',
        ExpressionAttributeNames: {
            '#n': 'status'
        },
        ExpressionAttributeValues: {
            ':value': newStatus
        }
    }

    return docClient.update(params).promise();
}