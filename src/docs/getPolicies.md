# getPolicies

> **Tier:** Pro

Fetch all shop policies (refund, privacy, terms, etc) from Shopify.

## Usage

```ts
const policies = await client.getPolicies();
```

## Example

```ts
const policies = await client.getPolicies();
console.log(policies.refundPolicy);
```

## Relevant Types

- `GetPoliciesOptions`
- `FetchPoliciesResult`
