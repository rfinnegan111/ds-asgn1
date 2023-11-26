import { APIGatewayProxyHandlerV2 } from "aws-lambda";  
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { 
  DynamoDBDocumentClient, 
  ScanCommand,
  GetCommand,
  QueryCommand,
  QueryCommandInput,
} from "@aws-sdk/lib-dynamodb";

const ddbClient = new DynamoDBClient({ region: process.env.REGION });
const ddbDocClient = createDDbDocClient();

export const handler: APIGatewayProxyHandlerV2 = async (event, context) => { 
  try {
    console.log("Event: ", event);
    const queryParams = event.queryStringParameters;

    let commandInput;
    let commandOutput;
    if (queryParams?.minRating) {
      commandInput = {
        TableName: process.env.REVIEW_TABLE_NAME,
        IndexName: "minRating",
        FilterExpression: "begins_with(content, :r) ",
        ExpressionAttributeValues: {
          ":r": queryParams.minRating?.toString(),
        },
      };
    } else {
        commandInput = {
          TableName: process.env.TABLE_NAME,
        }
    }
    commandOutput = await ddbClient.send(
      new ScanCommand( commandInput )
    );

    if (!commandOutput.Items) {
      return {
        statusCode: 404,
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ Message: "Incorrect Movie Item" }),
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