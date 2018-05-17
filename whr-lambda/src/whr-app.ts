import {OAuth2Client} from "google-auth-library";
import * as AWS from "aws-sdk";
import * as ApiBuilder from "claudia-api-builder";

const clientId = "492268521833-gj7jedogjobra2scfbvjdfj0c3a8pjp9.apps.googleusercontent.com";
const client = new OAuth2Client(clientId);

AWS.config.region = "eu-west-1";

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

export default app;