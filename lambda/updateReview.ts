import { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, UpdateCommand, PutCommand, PutCommandInput, DeleteCommand } from "@aws-sdk/lib-dynamodb";
import Ajv from "ajv";
import schema from "../shared/types.schema.json";
import { parse } from "querystring";

const ajv = new Ajv();
const isValidBodyParams = ajv.compile(schema.definitions["Review"] || {});

const ddbClient = new DynamoDBClient({ region: process.env.REGION });
const ddbDocClient = createDDbDocClient();

export const handler: APIGatewayProxyHandlerV2 = async (event, context) => {
  try {
    console.log("Event: ", event);
    const body = event.body ? JSON.parse(event.body) : undefined;
    const content = body?.content ? body.content : undefined;
    const parameters  = event?.pathParameters;
    const movieID = parameters?.movieID ? parseInt(parameters.movieID) : undefined;
    const reviewerName = parameters?.reviewerName ? parameters.reviewerName : undefined;
  
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
            message: `Incorrect must match review schema`,
            schema: schema.definitions["Review"],
          }),
        };
      }

      if (!movieID) {
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

        if (!content) {
          return {
            statusCode: 500,
            headers: {
              "content-type": "application/json",
            },
            body: JSON.stringify({ message: "Missing Content for Update" }),
          };
        }

    const commandOutput = await ddbDocClient.send(
      new UpdateCommand({
        TableName: process.env.REVIEW_TABLE_NAME,
        Key: { movieID: movieID },
        ConditionExpression:"movieID = :m and begins_with(reviewerName, :a) ",
        UpdateExpression: "SET content = :c" ,
        ExpressionAttributeValues: {
          ":m": movieID,
          ":a": reviewerName,
          ':c': { content },
        }
      })
    );

    return {
      statusCode: 201,
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({ message: "Review Changed" }),
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