import {OAuth2Client} from "google-auth-library";
import * as AWS from "aws-sdk";
import * as ApiBuilder from "claudia-api-builder";
import * as mailer from "nodemailer";

const clientId = "492268521833-gj7jedogjobra2scfbvjdfj0c3a8pjp9.apps.googleusercontent.com";
const client = new OAuth2Client(clientId);

AWS.config.region = "eu-west-1";

const ses = new AWS.SES({
    region: "eu-west-1"
});
const transport = mailer.createTransport({
    SES: ses
});

function sendInternalEmail(name: string, email: string, body: string) {
    return new Promise((resolve, reject) => {
        console.log("Sending internal email to: ", email);
        transport.sendMail({
            from: `${name} <alfie@akirkpatrick.com>`,
            to: "whitehouseringstead@gmail.com",
            replyTo: email,
            subject: `Web contact: ${name}`,
            text: body
        }, function (err: any, data: any) {
            if (err) {
                console.log("Error sending email: ", err);
                reject(err);
            } else {
                resolve({ok: true});
            }
        });
    });
}

function sendConfirmationEmail(email: string) {
    return new Promise((resolve, reject) => {
        console.log("Sending confirmation email to: ", email);
        transport.sendMail({
            from: `White House Ringstead <whitehouseringstead@gmail.com>`,
            to: email,
            replyTo: "whitehouseringstead@gmail.com",
            subject: "Confirmation of your request",
            text: "Thank you for contacting us. We'll get back to you shortly."
        }, function (err: any, data: any) {
            if (err) {
                console.log("Error sending email: ", err);
                reject(err);
            } else {
                resolve({ok: true});
            }
        });
    });
}

const app = new ApiBuilder();

async function verify(token: string, skip: boolean) {
    if (!skip) {
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: "492268521833-gj7jedogjobra2scfbvjdfj0c3a8pjp9.apps.googleusercontent.com",
        });
        const payload = ticket.getPayload();
        return payload['sub'];
    }
}

async function all_data() {
    const ddb = new AWS.DynamoDB.DocumentClient();

    const data: any = await ddb.scan({
        TableName: "whr-contact"
    }).promise();

    console.log(data);

    return data.Items;
}

app.get('/contact/list', async function (request) {
    await verify(request.headers.Authorization, request.env.skipVerify);
    return all_data();
});

app.post('/contact/{id}/responded/{value}', async function (request) {
    await verify(request.headers.Authorization, request.env.skipVerify);

    const ddb = new AWS.DynamoDB.DocumentClient();

    const params = {
        // ExpressionAttributeNames: {
        //     "#R": "responded"
        // },
        ExpressionAttributeValues: {
            ":R": request.pathParams.value
        },
        Key: {
            "id": request.pathParams.id
        },
        TableName: "whr-contact",
        UpdateExpression: "SET responded = :R"
    };

    await ddb.update(params).promise();
    return all_data();
});

app.delete('/contact/{id}', async function (request) {
    await verify(request.headers.Authorization, request.env.skipVerify);

    const ddb = new AWS.DynamoDB.DocumentClient();

    const params = {
        Key: {
            "id": request.pathParams.id
        },
        TableName: "whr-contact"
    };

    await ddb.delete(params).promise();
    return all_data();
});

function addEmailOptin(email: string) {
    const ddb = new AWS.DynamoDB.DocumentClient();
    const params = {
        Item: {
            email: email,
            created: new Date().getTime()
        },
        TableName: "whr-optin"
    };
    return ddb.put(params).promise();
}

app.put("/contact", async function (request) {

    const data = request.body.email ? request.body : JSON.parse(request.body);
    console.log("CREATE CONTACT: ", data);

    const ddb = new AWS.DynamoDB.DocumentClient();
    const params = {
        Item: {
            id: Math.floor(Math.random() * 1000000000000000).toString(),
            ...data,
            optin: data.optin || false,
            created: new Date().getTime()
        },
        TableName: "whr-contact"
    };
    const result = await ddb.put(params).promise();

    if (data.optin) {
        await addEmailOptin(data.email);
    }

    const {email, name, body, date, guests, optin} = data;
    const msg = `Email: ${email}\nName: ${name}\nDate requested: ${date || "not specified"}\nGuests: ${guests || "not specified"}\nMarketing opt-in: ${optin || false}\n\n${body}`;

    await sendInternalEmail(name, email, msg);
    await sendConfirmationEmail(email);
});

export default app;