import React from 'react';
import ReactDOM from 'react-dom'
import { ApolloProvider } from 'react-apollo';

import { ApolloClient } from 'apollo-client';
import { HttpLink } from 'apollo-link-http';
import { InMemoryCache } from 'apollo-cache-inmemory';
import { onError } from "apollo-link-error";

import App from './App'

import 'bulma/css/bulma.css'

const errorLink = onError(({ graphQLErrors, networkError }) => {
  if (graphQLErrors)
    graphQLErrors.map(({ message, locations, path }) =>
      console.log(
        `[GraphQL error]: Message: ${message}, Location: ${locations}, Path: ${path}`,
      ),
    );

  if (networkError) console.log(`[Network error]: ${networkError}`);
});

const cache = new InMemoryCache()

cache.writeData({data:{sessionID:'',sessionToken:''}})

const client = new ApolloClient({
  link:errorLink.concat(new HttpLink({ uri:'https://limitless-atoll-59109.herokuapp.com/graphql' })),
  cache,
});


ReactDOM.render(
    <ApolloProvider client={client}>
      <App />
    </ApolloProvider>,
  document.getElementById('root')
)
