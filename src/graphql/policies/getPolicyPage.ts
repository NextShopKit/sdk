export function getPolicyPageQuery(handle: string): string {
  return `
    query GetPolicyPage {
      page(handle: "${handle}") {
        id
        title
        handle
        body
      }
    }
  `;
}
