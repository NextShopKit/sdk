export const createCartMutation = `
  mutation createCart($attributes: [AttributeInput!]) {
    cartCreate(input: { attributes: $attributes }) {
      cart {
        id
        checkoutUrl
        cost {
          totalAmount { amount currencyCode }
        }
      }
    }
  }
`;
