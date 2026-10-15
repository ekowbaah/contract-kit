# contract-kit

Contract-first TypeScript primitives for defining schemas and endpoints once, then reusing their inferred types at runtime and compile time.

The initial MVP provides dependency-free object validation and immutable endpoint contracts. Planned packages add OpenAPI emission, compatibility checks, mock servers, and Angular adapters.

```bash
npm install
npm test
```

## Non-goals

This is not an application framework or an ORM. Transport and persistence remain explicit.

