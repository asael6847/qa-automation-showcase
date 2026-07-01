export const InventoryPage = {
  url: '/inventory.html',
  // El título "Products" confirma que el login llevó al inventario.
  title: '.title',
  shoppingCartBadge: '.shopping_cart_badge',
  shoppingCartLink: '.shopping_cart_link',
  /** Botón "Add to cart" de un producto, localizado por su nombre visible. */
  addToCartButton: (productName: string) =>
    `.inventory_item:has(.inventory_item_name:text-is("${productName}")) button`,
} as const;
