# contract-kit

Small TypeScript building blocks for API contracts.

Define an endpoint once, validate it at runtime, infer its types, generate a client, and emit a basic OpenAPI document. There is also a compatibility check for removed or moved endpoints and a deterministic mock transport for tests.

```ts
const getUser = endpoint({
  method: "POST",
  path: "/users/lookup",
  input: object("lookup", {id: string("id")}),
  output: object("user", {name: string("name")}),
});

const call = client(getUser, transport);
```

```sh
npm ci
npm test
```

It is not a web framework or an ORM. Transport and persistence stay in the application.
