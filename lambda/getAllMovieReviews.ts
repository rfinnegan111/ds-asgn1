import { APIGatewayProxyHandlerV2 } from "aws-lambda";  
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, ScanCommand, GetCommand } from "@aws-sdk/lib-dynamodb";;

const ddbClient = new DynamoDBClient({ region: process.env.REGION });
const ddbDocClient = createDDbDocClient();

export const handler: APIGatewayProxyHandlerV2 = async (event, context) => { 
  try {
    console.log("Event: ", event);
    const parameters  = event?.pathParameters;
    const movieID = parameters?.movieID ? parseInt(parameters.movieID) : undefined;

    if (!movieID) {
        return {
          statusCode: 404,
          headers: {
            "content-type": "application/json",
          },
          body: JSON.stringify({ Message: "Missing Movie Item" }),
        };
      }

      const commandOutput = await ddbClient.send(
        new ScanCommand({
          TableName: process.env.REVIEW_TABLE_NAME,
          FilterExpression: "movieID = :m",
          ExpressionAttributeValues: {
            ":m": movieID,
          },
        })
      );

      if (!commandOutput.Items) {
        return {
          statusCode: 404,
          headers: {
            "content-type": "application/json",
          },
          body: JSON.stringify({ Message: "Invalid Movie Item" }),
        };
      }
      const body = {
        data: commandOutput.Items,
      };

    // Return Response
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