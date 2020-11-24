import * as React from "react";
import { render } from "react-dom";
import {
  ApolloClient,
  ApolloProvider,
  HttpLink,
  InMemoryCache,
  gql,
  useQuery,
  useLazyQuery,
  useMutation,
  NetworkStatus,
  useApolloClient,
} from "@apollo/client";

const PLAIN_GET_USERS = gql`
  query getUsers {
    getUsers {
      name
      id
    }
  }
`;

const GET_USERS = gql`
  query getUsersAndGetUser($id: Int!) {
    getUsers {
      name
    }

    getUser(id: $id) {
      name
    }
  }
`;

const CHANGE_USER_NAME = gql`
  mutation changeName($id: Int!, $newName: String!) {
    changeName(id: $id, newName: $newName) {
      name
      id
    }
  }
`;

export const MutationQuery: React.FC = () => {
  const { data, loading, error } = useQuery(PLAIN_GET_USERS);
  const [changeName] = useMutation(CHANGE_USER_NAME);

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error</p>;

  return (
    <>
      <h3>Get Users</h3>
      {data?.getUsers?.map((u: any, i: number) => (
        <p key={i}>{u.name}</p>
      ))}

      <button
        onClick={() =>
          changeName({ variables: { id: 1, newName: "Fernando Chujarez" } })
        }
      >
        Zmenit Jmeno
      </button>
    </>
  );
};

export const LazyFetch: React.FC = () => {
  const [
    getData,
    { loading, error, data, refetch, networkStatus },
  ] = useLazyQuery(GET_USERS, {
    variables: { id: 1 },
    notifyOnNetworkStatusChange: true,
  });
  const client = useApolloClient();

  console.log(
    "READ QUERY",
    client.readQuery({ query: GET_USERS, variables: { id: 1 } })
  );

  if (networkStatus === NetworkStatus.refetch) return <p>Refetching!</p>;
  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error</p>;

  return (
    <div>
      {data ? (
        <>
          <h3>Get Users Query</h3>
          {data.getUsers.map((u: any, i: number) => (
            <p key={i}>{u.name}</p>
          ))}
          <h3>Get User Query</h3>
          <p>{data.getUser.name}</p>
        </>
      ) : (
        <p>nothing to show</p>
      )}

      {/* @ts-ignore */}
      <button onClick={() => (data ? refetch() : getData())}>Get data</button>
    </div>
  );
};

export const BasicFetch: React.FC = () => {
  const { loading, error, data, refetch } = useQuery(GET_USERS, {
    variables: { id: 2 },
    pollInterval: 2000,
  });

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error</p>;

  console.log(data);

  return (
    <div>
      <h3>Get Users Query</h3>
      {data?.getUsers?.map((u: any, i: number) => (
        <p key={i}>{u.name}</p>
      ))}
      <h3>Get User Query</h3>
      <p>{data?.getUser?.name}</p>

      <button onClick={() => refetch()}>Fetch again</button>
    </div>
  );
};

const client = new ApolloClient({
  cache: new InMemoryCache(),
  link: new HttpLink({
    uri: "http://localhost:4000/graphql",
  }),
});

render(
  <ApolloProvider client={client}>
    {/* <BasicFetch /> */}
    {/* <LazyFetch /> */}
    <MutationQuery />
  </ApolloProvider>,
  document.getElementById("root")
);

// Apollo Cache ma 2 strategie pro garbage collecting, je mozne si z nich vybrat
// Pri fetchovani dat je mozne pouzit pagination a specifikovat, kolik udaju a odkud je chceme
// Existuji ruzne strategie pro intergraci s lokalnim state managementem, vseobecne se doporucuje pouzivat Apollo Cache, ale pokud pouzivame napr MobX, mozna by se vice hodilo pouzit graphql-request
// Pro zrychleni performance je mozne pouzit tzv. Optimistic UI, kdy ke zmene cache dojde jeste predtim, nez se vykona mutace a po jejim resolvu se data v cache nahradi odpovedi z mutace
// Apollo Client ma i techniky pro SSR (obdoba napr. getInitialProps u nextu)
