import { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { MovieAndReviewQueryParams } from "../shared/types";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  QueryCommand,
  QueryCommandInput,
  ScanCommand,
  GetCommand
} from "@aws-sdk/lib-dynamodb";
import Ajv from "ajv";
import schema from "../shared/types.schema.json";
import { parse } from "querystring";

const ajv = new Ajv();
const isValidQueryParams = ajv.compile(
  schema.definitions["MovieAndReviewQueryParams"] || {}
);
 
const ddbClient = new DynamoDBClient({ region: process.env.REGION });
const ddbDocClient = createDDbDocClient();

export const handler: APIGatewayProxyHandlerV2 = async (event, context) => {
  try {
    console.log("Event: ", event);
    const parameters  = event?.pathParameters;
    const queryParams = event.queryStringParameters;
    const movieID = parameters?.movieId ? parseInt(parameters.movieId) : undefined;
    const reviewerName = parameters?.reviewerName ? parameters.reviewerName : undefined;
    

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
    
    const ddbDocClient = createDocumentClient();
    const commandOutput = await ddbClient.send(
      new ScanCommand({
        TableName: process.env.REVIEW_TABLE_NAME,
        FilterExpression: "movieID = :m and begins_with(reviewerName, :a) ",
        ExpressionAttributeValues: {
          ":m": movieID,
          ":a": reviewerName,
        },
      })
    );
   
    if (!commandOutput.Items) {
      return {
        statusCode: 404,
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ Message: "Invalid movie  or reviewer name" }),
      };
    }
    const body = {
      data: commandOutput.Items,
    };
      
    return {
      statusCode: 200,
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(body),
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
  
  function createDocumentClient() {
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