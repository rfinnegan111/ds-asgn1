import {Movie, MovieReview} from '../shared/types'

export const movies : Movie[] = [
  {
    movieID: 1234,
    genre_ids: [45, 39, 52],
    original_language: 'English',
    overview:
      "Every six years, an ancient order of jiu-jitsu fighters joins forces to battle a vicious race of alien invaders. But when a celebrated war hero goes down in defeat, the fate of the planet and mankind hangs in the balance.",
    popularity: 2633.943,
    release_date: "2020-11-20",
    title: "Title 1234",
    video: false,
    vote_average: 5.9,
    vote_count: 111,
  },
  {
    movieID: 4567,
    genre_ids: [58, 1, 82],
    original_language: 'French',
    overview:
      "Generic Hallmark Christmas Movie",
    popularity: 2633.943,
    release_date: "2020-11-20",
    title: "Title 1234",
    video: false,
    vote_average: 5.9,
    vote_count: 111,
  },
  {
    movieID: 2345,
    genre_ids: [28, 14, 32],
    original_language: 'English',
    overview:
      "Generic Action Hero Movie",
    popularity: 2633.943,
    release_date: "2020-11-21",
    title: "Title 2345",
    video: false,
    vote_average: 5.9,
    vote_count: 111,
  },
  {
    movieID: 3456,
    genre_ids: [6, 4, 2],
    original_language: 'English',
    overview:
      "Generic Boring Movie",
    popularity: 2633.943,
    release_date: "2020-11-21",
    title: "Title 3456",
    video: false,
    vote_average: 5.9,
    vote_count: 111,
  },
];

export const movieReviews: MovieReview[] = [
  {
    movieID: 1234,
    reviewerName: "John Deere",
    reviewDate: "2023-10-20",
    content: "5 stars - stellar",
  },
  {
    movieID: 1234,
    reviewerName: "Alice Logg",
    reviewDate: "2023-05-03",
    content: "4 stars - enjoyed the timw",
  },
  {
    movieID: 1234,
    reviewerName: "Joe Dan",
    reviewDate: "2023-11-16",
    content: "3 stars - tis alright",
  },
  {
    movieID: 2345,
    reviewerName: "Joes Loe",
    reviewDate: "2023-10-23",
    content: "2 stars - cant see why people watch it",
  },
  {
    movieID: 2345,
    reviewerName: "John Doe",
    reviewDate: "2023-10-30",
    content: "1 star - fell asleep",
  },
];