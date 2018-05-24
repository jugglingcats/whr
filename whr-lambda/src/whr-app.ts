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

function sendEmail(name: string, email: string, subject: string, body: string) {
    return new Promise((resolve, reject) => {
        transport.sendMail({
            from: `${name} <alfie@akirkpatrick.com>`,
            to: "whitehouseringstead@gmail.com",
            replyTo: email,
            subject: `Web contact: ${subject}`,
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

app.put("/contact", async function (request) {
    console.log("CREATE CONTACT: ", request);
    // return all_data();

    const {email, name, subject, body, optin} = request.body;
    await sendEmail(name, email, subject, body);
});

export default app;