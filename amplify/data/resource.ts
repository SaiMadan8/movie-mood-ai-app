import { type ClientSchema, a, defineData } from "@aws-amplify/backend";

const schema = a.schema({
  // User's mood assessment
  MoodAssessment: a
    .model({
      mood: a.string(),
      timestamp: a.timestamp(),
    })
    .authorization((allow) => [allow.owner()]),
    
  // Static movie database for testing
  Movie: a
    .model({
      title: a.string(),
      genre: a.string(),
      moodTag: a.string(),
      rating: a.float(),
      description: a.string(),
    })
    .authorization((allow) => [allow.publicApiKey(), allow.owner().to(['read'])]),
    
  // User's movie interactions
  UserMovie: a
    .model({
      movieId: a.string(),
      movieTitle: a.string(),
      userRating: a.integer(),
      watched: a.boolean(),
    })
    .authorization((allow) => [allow.owner()]),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: "userPool",
    apiKeyAuthorizationMode: {
      expiresInDays: 30,
    },
  },
});
