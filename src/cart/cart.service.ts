import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CartSchemaClass, CartItemClass } from './entities/cart.schema';
import { AddToCartData, UpdateCartItemData } from './types/cart.types';
import { ProductItemService } from '../product-item/product-item.service';

@Injectable()
export class CartService {
  constructor(
    @InjectModel(CartSchemaClass.name)
    private readonly cartModel: Model<CartSchemaClass>,
    private readonly productItemService: ProductItemService,
  ) {}

  private transformCartResponse(cart: any) {
    return {
      _id: cart._id.toString(),
      userId: cart.userId,
      items: cart.items.map((item: any) => ({
        _id: item._id.toString(),
        productItemId: item.productItemId,
        productName: item.productName,
        price: item.price,
        quantity: item.quantity,
        productDate: item.productDate?.toISOString(),
        productStartTime: item.productStartTime,
        productDuration: item.productDuration,
        vendorId: item.vendorId,
        createdAt: item.createdAt?.toISOString(),
        updatedAt: item.updatedAt?.toISOString()
      })),
      isCheckingOut: cart.isCheckingOut,
      createdAt: cart.createdAt?.toISOString(),
      updatedAt: cart.updatedAt?.toISOString()
    };
  }

  async setCheckoutStatus(userId: string, isCheckingOut: boolean) {
    const cart = await this.cartModel.findOne({ userId });
    
    if (!cart) {
      throw new NotFoundException('Cart not found');
    }

    cart.isCheckingOut = isCheckingOut;
    // If we're resetting checkout status, update the timestamp to prevent immediate cleanup
    if (!isCheckingOut) {
      cart.updatedAt = new Date();
    }
    
    const savedCart = await cart.save();
    return this.transformCartResponse(savedCart);
  }

  async addToCart(addToCartData: AddToCartData) {
    const session = await this.cartModel.db.startSession();
    
    try {
      return await session.withTransaction(async () => {
        const { userId, productItemId, quantity } = addToCartData;
  
        const isAvailable = await this.productItemService.validateAvailability(
          productItemId,
          quantity
        );
  
        if (!isAvailable) {
          throw new BadRequestException('Product item is not available in requested quantity');
        }
  
        await this.productItemService.updateQuantityForPurchase(
          productItemId,
          quantity
        );
  
        let cart = await this.cartModel.findOne({ userId }).session(session);
        
        if (!cart) {
          cart = new this.cartModel({
            userId,
            items: [],
          });
        }
  
        const existingItemIndex = cart.items.findIndex(
          item => item.productItemId === productItemId
        );
  
        if (existingItemIndex > -1) {
          cart.items[existingItemIndex].quantity += quantity;
        } else {
          cart.items.push({
            productItemId: addToCartData.productItemId,
            productName: addToCartData.productName,
            price: addToCartData.price,
            quantity: addToCartData.quantity,
            productDate: addToCartData.productDate,
            productStartTime: addToCartData.productStartTime,
            productDuration: addToCartData.productDuration,
            vendorId: addToCartData.vendorId
          });
        }
  
        const savedCart = await cart.save({ session });
        return this.transformCartResponse(savedCart);
      });
    } catch (error) {
      throw error;
    } finally {
      await session.endSession();
    }
  }

  async updateCartItem(
    userId: string,
    productItemId: string,
    updateData: UpdateCartItemData
  ) {
    const cart = await this.cartModel.findOne({ userId });
    
    if (!cart) {
      throw new NotFoundException('Cart not found');
    }

    const itemIndex = cart.items.findIndex(
      item => item.productItemId === productItemId
    );

    if (itemIndex === -1) {
      throw new NotFoundException('Item not found in cart');
    }

    const isAvailable = await this.productItemService.validateAvailability(
      productItemId,
      updateData.quantity
    );

    if (!isAvailable) {
      throw new BadRequestException('Requested quantity is not available');
    }

    cart.items[itemIndex].quantity = updateData.quantity;
    const savedCart = await cart.save();
    return this.transformCartResponse(savedCart);
  }
  
  async removeFromCart(userId: string, productItemId: string) {
    const session = await this.cartModel.db.startSession();
    
    try {
      return await session.withTransaction(async () => {
        const cart = await this.cartModel.findOne({ userId }).session(session);
        
        if (!cart) {
          throw new NotFoundException('Cart not found');
        }

        const itemToRemove = cart.items.find(item => item.productItemId === productItemId);
        if (itemToRemove) {
          // Return the quantity back to inventory
          await this.productItemService.updateQuantity(
            productItemId,
            itemToRemove.quantity
          );
        }

        cart.items = cart.items.filter(item => item.productItemId !== productItemId);
        const savedCart = await cart.save({ session });
        return this.transformCartResponse(savedCart);
      });
    } catch (error) {
      throw error;
    } finally {
      await session.endSession();
    }
  }

  async getCart(userId: string) {
    const cart = await this.cartModel.findOne({ userId });
    return cart ? this.transformCartResponse(cart) : { userId, items: [] };
  }

  async clearCart(userId: string) {
    const session = await this.cartModel.db.startSession();
    
    try {
      return await session.withTransaction(async () => {
        const cart = await this.cartModel.findOne({ userId }).session(session);
        
        if (!cart) {
          return { userId, items: [] };
        }

        // Return all items to inventory
        for (const item of cart.items) {
          await this.productItemService.updateQuantity(
            item.productItemId,
            item.quantity
          );
        }

        cart.items = [];
        const savedCart = await cart.save({ session });
        return this.transformCartResponse(savedCart);
      });
    } catch (error) {
      throw error;
    } finally {
      await session.endSession();
    }
  }

  async deleteCart(userId: string) {
    const cart = await this.cartModel.findOneAndDelete({ userId });
    return cart ? this.transformCartResponse(cart) : { userId, items: [] };
  }
}