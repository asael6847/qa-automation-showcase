export const CartPage = {
  url: '/cart.html',
  title: '.title',
  cartItem: '.cart_item',
  checkoutButton: '[data-test="checkout"]',
  /** Botón "Remove" de un producto dentro del carrito, por nombre. */
  removeButton: (productName: string) =>
    `.cart_item:has(.inventory_item_name:text-is("${productName}")) button`,
} as const;
