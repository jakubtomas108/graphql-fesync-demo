import http from "http";
import express from "express";
import { ApolloServer, gql, PubSub } from "apollo-server-express";

const pubsub = new PubSub();

interface User {
  id: number;
  name?: string | null;
}

interface Book {
  id: number;
  title: string;
}

let users: User[] = [
  { id: 0, name: "Michal Hlaváč" },
  { id: 1, name: "Jakub Tomáš" },
  { id: 2, name: "Ivan Čentéš" },
  { id: 3, name: "Václav Beneš" },
];

let books: { [key: string]: Book[] } = {
  "Michal Hlaváč": [
    { id: 0, title: "Game of Thrones" },
    { id: 1, title: "Clash of the Kings" },
  ],
  "Jakub Tomáš": [
    { id: 3, title: "Pán Prstenu" },
    { id: 4, title: "Hobit" },
  ],
  "Ivan Čentéš": [
    { id: 5, title: "Honzíkova cesta" },
    { id: 6, title: "Rychlé šípy" },
  ],
  "Václav Beneš": [
    { id: 7, title: "50 odstínů šedi" },
    { id: 8, title: "Matrix: The Comix" },
  ],
};

const typeDefs = gql`
  type Query {
    getUsers: [User]
    getUser(id: Int!): User
  }

  type Mutation {
    changeName(id: Int!, newName: String!): User
  }

  type User {
    id: Int!
    name: String!
    books: [Book]
    firstName: String
  }

  type Book {
    id: Int
    title: String
  }

  type Subscription {
    spyOnUsers: String!
  }
`;

const SUB_ACTION = "SPY_ON_HIM";

const resolvers = {
  Query: {
    getUsers: () => {
      return users.map((user) => ({ ...user, books: books[user.name || ""] }));
    },
    getUser: (parent: any, args: any, ctx: any, info: any) => {
      const { id } = args;
      const user = users.find((u) => u.id === id) as User;
      pubsub.publish(SUB_ACTION, {
        spyOnUsers: `${user.name} is looking on his profile right now!!!!!!`,
      });

      return { ...user, books: books[user.name || ""] };
    },
  },
  Mutation: {
    changeName: (parent: any, args: any, ctx: any, info: any) => {
      const { id, newName } = args;
      const user = users.find((u) => u.id === id) as User;
      user.name = newName;

      return { ...user, books: books[user.name || ""] };
    },
  },
  User: {
    name: (parent: any) => {
      return parent.name;
    },
    firstName: (parent: any) => {
      return parent.name.split(" ")[0];
    },
  },
  Subscription: {
    spyOnUsers: {
      subscribe: () => {
        return pubsub.asyncIterator(SUB_ACTION);
      },
    },
  },
};

const server = new ApolloServer({
  typeDefs: [typeDefs],
  resolvers,
  context: (req: Request, res: Response) => ({
    req,
    res,
  }),
});

const port = 4000;
const app = express();
const httpServer = http.createServer(app);
server.applyMiddleware({ app });
server.installSubscriptionHandlers(httpServer);

httpServer.listen({ port }, () =>
  console.log(`🚀 Server ready at http://localhost:4000${server.graphqlPath}`)
);
