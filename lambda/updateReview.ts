import { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand, DeleteCommand } from "@aws-sdk/lib-dynamodb";
import Ajv from "ajv";
import schema from "../shared/types.schema.json";
import { parse } from "querystring";

const ajv = new Ajv();
const isValidBodyParams = ajv.compile(schema.definitions["MovieReview"] || {});

const ddbDocClient = createDDbDocClient();

export const handler: APIGatewayProxyHandlerV2 = async (event, context) => {
  try {
    console.log("Event: ", event);
    const body = event.body ? JSON.parse(event.body) : undefined;
    const parameters  = event?.pathParameters;
    const movieId = parameters?.movieId ? parseInt(parameters.movieId) : undefined;
    const reviewerName = parameters?.revewerName ? parse(parameters.revewerName) : undefined;
  
    if (!body) {
      return {
        statusCode: 500,
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ message: "Missing Request" }),
      };
    }

    if (!isValidBodyParams(body)) {
        return {
          statusCode: 500,
          headers: {
            "content-type": "application/json",
          },
          body: JSON.stringify({
            message: `Incorrect must match movie schema`,
            schema: schema.definitions["MovieReview"],
          }),
        };
      }

      if (!movieId) {
        return {
          statusCode: 404,
          headers: {
            "content-type": "application/json",
          },
          body: JSON.stringify({ Message: "Missing Movie Item" }),
        };
      }
  
      if (!reviewerName) {
          return {
            statusCode: 404,
            headers: {
              "content-type": "application/json",
            },
            body: JSON.stringify({ Message: "Missing Reviewer" }),
          };
        }

    const commandOutput = await ddbDocClient.send(
      new PutCommand({
        TableName: process.env.REVIEW_TABLE_NAME,
        Item: {body},
      })
    );
    return {
      statusCode: 201,
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({ message: "Review Updated" }),
    };
  } catch (error: any) {
    console.log(JSON.stringify(error));
    return {
      statusCode: 500,
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({ error }),
    };
  }
};

function createDDbDocClient() {
  const ddbClient = new DynamoDBClient({ region: process.env.REGION });
  const marshallOptions = {
    convertEmptyValues: true,
    removeUndefinedValues: true,
    convertClassInstanceToMap: true,
  };
  const unmarshallOptions = {
    wrapNumbers: false,
  };
  const translateConfig = { marshallOptions, unmarshallOptions };
  return DynamoDBDocumentClient.from(ddbClient, translateConfig);
}