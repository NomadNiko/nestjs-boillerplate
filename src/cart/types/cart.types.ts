export interface CartItemData {
    productItemId: string;
    productName: string;
    price: number;
    quantity: number;
    productDate: Date;
    productStartTime: string;
    productDuration: number;
    vendorId: string;
  }
  
  export interface AddToCartData extends CartItemData {
    userId: string;
  }
  
  export interface UpdateCartItemData {
    quantity: number;
  }