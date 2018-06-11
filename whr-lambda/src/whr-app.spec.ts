import app from "./whr-app";
import * as AWS from "aws-sdk";

jest.setTimeout(10000);

const context = {
    done: (e, result) => {
        if (e) {
            fail(e);
        } else if (result.statusCode !== 200) {
            fail("expected 200 status code: " + JSON.parse(result.body).errorMessage)
        } else {
            console.log(result);
        }
    }
};

AWS.config.credentials = new AWS.SharedIniFileCredentials({profile: 'claudia'});

describe("whr", function () {
    it("should return all contacts", function (done) {
        app.proxyRouter({
            requestContext: {
                resourcePath: '/contact/list',
                httpMethod: 'GET'
            },
            stageVariables: {
                skipVerify: true,
            }
        }, context).then(done, fail)
    });

    it("should update responded value", function (done) {
        app.proxyRouter({
            requestContext: {
                resourcePath: '/contact/{id}/responded/{value}',
                httpMethod: 'POST'
            },
            pathParameters: {
                id: "12345",
                value: "Yes"
            },
            stageVariables: {
                skipVerify: true,
            }
        }, context).then(done, fail)
    });

    it("should delete contacts", function (done) {
        app.proxyRouter({
            requestContext: {
                resourcePath: '/contact/{id}',
                httpMethod: 'DELETE'
            },
            pathParameters: {
                id: "12345"
            },
            stageVariables: {
                skipVerify: true,
            }
        }, context).then(done, fail)
    });

    it("should create a contact and send email", function (done) {
        app.proxyRouter({
            requestContext: {
                resourcePath: "/contact",
                httpMethod: "PUT"
            },
            body: {
                email: "whr-dev@mailinator.com",
                name: "Alfie (test)",
                body: "I'd love to rent the place in August...",
                referer: "https://www.google.com?q=xyz",
                date: "1 July, 1980",
                guests: 100,
                optin: true
            }
        }, context).then(done, fail)
    })
});