## CA 1 Submission - Distributed Systems.

__Name:__ Rebecca Finnegan
__Student Number:__ 20093862

This repository contains my submission for Assignment 1 of the Distributed Systems Module. The submission consists of a serverless REST API for the AWS platform. A CDK stack creates the infrastructure. The domain context of the API is Movies.

### API endpoints.

POST

    POST /movies/reviews - add movie review

GET

    GET /movies - get movie data
    GET /movies/{movieId} - get data regarding specific movie
    GET /movies/{movieId}/reviews - get reviews for sepcific movie 
    GET /movies/{movieId}/reviews?minRating=n - get reviews for specific movie with a rating same as minRating
    GET /movies?minRating=n - get reviews for all movies with rating same as minRating
    GET /movies/{movieId}/reviews/{reviewerName} - get review for specific movie and written by specified reviewer
    GET /movies/reviews/{reviewerName} - get all reviews from all movies written by specified
    Attempted:
    GET /movies/{movieId}/reviews/{year} - get review for specific movie by year

PUT 

    Attempted:
    PUT /movies/{movieId}/reviews/{reviewerName} - update a review

![Alt text](<Screenshot (111).png>)

![Alt text](<Screenshot (113).png>)

### Authentication..

[Include a screenshot from the AWS console (Cognito User Pools) showing a confirmed user account.]

![Alt text](<Screenshot (115).png>)

### Independent learning (If relevant).

No excess Independant Learning carried out.
