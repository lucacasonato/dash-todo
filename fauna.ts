const token = Deno.env.get("FAUNA_TOKEN");

export interface GraphQLErrorLocation {
  line: number;
  column: number;
}

export class GraphQLError extends Error {
  name = "GraphQLError";
  locations?: GraphQLErrorLocation[];
  path?: (string | number)[];

  constructor(
    message: string,
    locations?: GraphQLErrorLocation[],
    path?: (string | number)[]
  ) {
    super(message);
    this.locations = locations;
    this.path = path;
  }

  toString(): string {
    let message = `GraphQLError: ${this.message}`;
    if (this.locations && this.locations.length > 1) {
      message += " @";
      for (const location of this.locations || []) {
        message += ` line ${location.line}, col ${location.column};`;
      }
    }
    return message;
  }
}

export async function query<T>(
  query: string,
  variables?: Record<string, unknown>
): Promise<T> {
  const res = await fetch("https://graphql.fauna.com/graphql", {
    method: "POST",
    headers: {
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
      accepts: "application/json",
      "X-Schema-Preview": "partial-update-mutation",
    },
    body: JSON.stringify({
      query,
      variables,
    }),
  });
  const data = await res.json();
  if ("errors" in data) {
    const error = data.errors[0];
    throw new GraphQLError(error.message, error.locations, error.path);
  }
  return data.data;
}
