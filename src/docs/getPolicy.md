# getPolicy

> **Tier:** Pro

Fetch a single shop policy by type (refund, privacy, terms, etc).

## Usage

```ts
const policy = await client.getPolicy({ type: "refund" });
```

## Example

```ts
const policy = await client.getPolicy({ type: "privacy" });
console.log(policy.body);
```

## Relevant Types

- `GetPolicyOptions`
- `FetchPolicyResult`
