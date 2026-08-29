import { ApolloClient, InMemoryCache, createHttpLink } from "@apollo/client";
import { setContext } from "@apollo/client/link/context";
import { auth } from "@/lib/firebase";

/**
 * Builds the GraphQL request headers for the Firebase → Hasura JWT boundary.
 *
 * When a user is signed in, their Firebase ID token is attached as
 * `Authorization: Bearer <token>` so Hasura can validate it and map its claims
 * to a role/permissions. When signed out, no Authorization header is sent.
 *
 * Extracted from the `authLink` so it can be unit/integration tested directly.
 */
export async function buildAuthHeaders(
  headers: Record<string, string> = {},
): Promise<Record<string, string>> {
  const currentUser = auth.currentUser;
  const token = currentUser ? await currentUser.getIdToken() : null;
  return {
    ...headers,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export const authLink = setContext(async (_, { headers }) => ({
  headers: await buildAuthHeaders(headers),
}));

export const apolloClient = new ApolloClient({
  link: authLink.concat(
    createHttpLink({
      uri: process.env.NEXT_PUBLIC_HASURA_GRAPHQL_URL,
      fetchOptions: { cache: "no-store" },
    })
  ),
  cache: new InMemoryCache(),
});
