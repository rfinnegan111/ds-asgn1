import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as apig from "aws-cdk-lib/aws-apigateway";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as node from "aws-cdk-lib/aws-lambda-nodejs";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as custom from "aws-cdk-lib/custom-resources";
import { generateBatch } from "../shared/util";
import { movies, movieReviews } from "../seed/movies";

type MovieAppApiProps = {
  userPoolId: string;
  userPoolClientId: string;
};

export class MovieAppApi extends Construct {
  constructor(scope: Construct, id: string, props: MovieAppApiProps) {
    super(scope, id);

    const movieAppApi = new apig.RestApi(this, "MovieAppApi", {
      description: "Movie App RestApi",
      endpointTypes: [apig.EndpointType.REGIONAL],
      defaultCorsPreflightOptions: {
        allowOrigins: apig.Cors.ALL_ORIGINS,
      },
    });

    const appCommonFnProps = {
      architecture: lambda.Architecture.ARM_64,
      timeout: cdk.Duration.seconds(10),
      memorySize: 128,
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: "handler",
      environment: {
        USER_POOL_ID: props.userPoolId,
        CLIENT_ID: props.userPoolClientId,
        REGION: cdk.Aws.REGION,
      },
    };

    const moviesTable = new dynamodb.Table(this, "MoviesTable", {
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      partitionKey: { name: "movieId", type: dynamodb.AttributeType.NUMBER },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      tableName: "Movies",
    });

    const movieReviewsTable = new dynamodb.Table(this, "MovieReviewTable", {
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      partitionKey: { name: "movieId", type: dynamodb.AttributeType.NUMBER },
      sortKey: { name: "reviewerName", type: dynamodb.AttributeType.STRING },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      tableName: "MovieReview",
    });

    movieReviewsTable.addLocalSecondaryIndex({
      indexName: "ratingIx",
      sortKey: { name: "content", type: dynamodb.AttributeType.STRING },
    });

    new custom.AwsCustomResource(this, "moviesddbInitData", {
      onCreate: {
        service: "DynamoDB",
        action: "batchWriteItem",
        parameters: {
          RequestItems: {
            [moviesTable.tableName]: generateBatch(movies),
            [movieReviewsTable.tableName]: generateBatch(movieReviews),  
          },
        },
        physicalResourceId: custom.PhysicalResourceId.of("moviesddbInitData"), 
      },
      policy: custom.AwsCustomResourcePolicy.fromSdkCalls({
        resources: [moviesTable.tableArn, movieReviewsTable.tableArn],  
      }),
    });

    const getAllMoviesRes = movieAppApi.root.addResource("movies");
    const getMovieRes = getAllMoviesRes.addResource("{movieId}");
    const addReviewRes = getMovieRes.addResource("reviews");
    const getReviewRes = addReviewRes.addResource("{reviewerName}");


    const addReviewFn = new node.NodejsFunction(this, "AddReviewFn", {
      ...appCommonFnProps,
      entry: "./lambda/addReview.ts",
    });
    const removeReviewFn = new node.NodejsFunction(this, "RemoveReviewFn", {
      ...appCommonFnProps,
      entry: "./lambda/removeReview.ts",
    });
    const updateReviewFn = new node.NodejsFunction(this, "UpdateReviewFn", {
      ...appCommonFnProps,
      entry: "./lambda/updateReview.ts",
    });

    const getAllMoviesFn = new node.NodejsFunction(this, "GetAllMoviesFn", {
      ...appCommonFnProps,
      entry: "./lambda/getAllMovies.ts",
      architecture: lambda.Architecture.ARM_64,
      runtime: lambda.Runtime.NODEJS_16_X,
      timeout: cdk.Duration.seconds(10),
      memorySize: 128,
      environment: {
        TABLE_NAME: moviesTable.tableName,
          REGION: 'eu-west-1',
      },
    });
    const getMovieByIdFn = new node.NodejsFunction(this, "GetMovieByIdFn", {
      ...appCommonFnProps,
      entry: "./lambda/public.ts",
    });
    const getMovieReviewsFn = new node.NodejsFunction(this, "GetMovieReviewsFn", {
      ...appCommonFnProps,
      entry: "./lambda/getMovieReview.ts",
    });
    

    const authorizerFn = new node.NodejsFunction(this, "AuthorizerFn", {
      ...appCommonFnProps,
      entry: "./lambda/auth/authorizer.ts",
    });

    moviesTable.grantReadData(getAllMoviesFn)

    const requestAuthorizer = new apig.RequestAuthorizer(
      this,
      "RequestAuthorizer",
      {
        identitySources: [apig.IdentitySource.header("cookie")],
        handler: authorizerFn,
        resultsCacheTtl: cdk.Duration.minutes(0),
      }
    );

    getAllMoviesRes.addMethod("GET", new apig.LambdaIntegration(getAllMoviesFn));
    getMovieRes.addMethod("GET", new apig.LambdaIntegration(getMovieByIdFn));
    getReviewRes.addMethod("GET", new apig.LambdaIntegration(getMovieReviewsFn));

    addReviewRes.addMethod("POST", new apig.LambdaIntegration(addReviewFn), {
      authorizer: requestAuthorizer,
      authorizationType: apig.AuthorizationType.CUSTOM,
    });
    getReviewRes.addMethod("DELETE", new apig.LambdaIntegration(removeReviewFn), {
      authorizer: requestAuthorizer,
      authorizationType: apig.AuthorizationType.CUSTOM,
    });
    getReviewRes.addMethod("PUT", new apig.LambdaIntegration(updateReviewFn), {
      authorizer: requestAuthorizer,
      authorizationType: apig.AuthorizationType.CUSTOM,
    });

  }
}