import { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { MovieReviewQueryParams } from "../shared/types";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  QueryCommand,
  QueryCommandInput,
} from "@aws-sdk/lib-dynamodb";
import Ajv from "ajv";
import schema from "../shared/types.schema.json";

const ajv = new Ajv();
const isValidQueryParams = ajv.compile(
  schema.definitions["MovieReviewQueryParams"] || {}
);
 
const ddbDocClient = createDocumentClient();

export const handler: APIGatewayProxyHandlerV2 = async (event, context) => {
  try {
    console.log("Event: ", event);
    const queryParams = event.queryStringParameters;
    if (!queryParams) {
      return {
        statusCode: 500,
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ message: "Missing query parameters" }),
      };
    }
    if (!isValidQueryParams(queryParams)) {
      return {
        statusCode: 500,
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          message: `Incorrect Match Query parameters schema`,
          schema: schema.definitions["MovieReviewQueryParams"],
        }),
      };
    }

    let commandInput: QueryCommandInput = {
      TableName: process.env.TABLE_NAME,
    };
    if (queryParams.movieId != undefined) {
      const movieId = parseInt(queryParams.movieId);
      if ("minRating" in queryParams) {
      commandInput = {
        ...commandInput,
        IndexName: "ratingIx",
        KeyConditionExpression: "movieId = :m and minRating < :r) ",
        ExpressionAttributeValues: {
          ":m": movieId,
          ":r": queryParams.minRating,
        },
      };
    } else if ("reviewerName" in queryParams) {
        commandInput = {
          ...commandInput,
          KeyConditionExpression: "movieId = :m and begins_with(reviewerName, :a) ",
          ExpressionAttributeValues: {
            ":m": movieId,
            ":a": queryParams.reviewerName,
          },
        };
      } else {
      commandInput = {
        ...commandInput,
        KeyConditionExpression: "movieId = :m",
        ExpressionAttributeValues: {
          ":m": movieId,
        },
      };
    }
  }
    
    const commandOutput = await ddbDocClient.send(
      new QueryCommand(commandInput)
      );
      
      return {
        statusCode: 200,
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          data: commandOutput.Items,
        }),
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