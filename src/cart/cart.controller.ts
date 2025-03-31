import { 
  Controller, 
  Get, 
  Post, 
  Put,
  Delete, 
  Body, 
  Param, 
  UseGuards,
  Request 
} from '@nestjs/common';
import { CartService } from './cart.service';
import { AuthGuard } from '@nestjs/passport';
import { AddToCartDto } from './dto/cart.dto';
import { ProductItemService } from '../product-item/product-item.service';

@Controller('cart')
@UseGuards(AuthGuard('jwt'))
export class CartController {
  constructor(
    private readonly cartService: CartService,
    private readonly productItemService: ProductItemService,
  ) {}

  @Post('add')
  async addToCart(@Body() addToCartDto: AddToCartDto, @Request() req) {
    const productItem = await this.productItemService.findById(addToCartDto.productItemId);
    
    const cartData = {
      ...addToCartDto,
      userId: req.user.id,
      productName: productItem.data.templateName,
      price: productItem.data.price,
      productStartTime: productItem.data.startTime,
      productDuration: productItem.data.duration,
      vendorId: productItem.data.vendorId
    };

    return this.cartService.addToCart(cartData);
  }

  @Put(':productItemId')
  async updateCartItem(
    @Param('productItemId') productItemId: string,
    @Body() updateData: { quantity: number },
    @Request() req
  ) {
    return this.cartService.updateCartItem(req.user.id, productItemId, updateData);
  }

  @Delete(':productItemId')
  async removeFromCart(
    @Param('productItemId') productItemId: string,
    @Request() req
  ) {
    return this.cartService.removeFromCart(req.user.id, productItemId);
  }

  @Get()
  async getCart(@Request() req) {
    return this.cartService.getCart(req.user.id);
  }

  @Delete()
  async clearCart(@Request() req) {
    return this.cartService.clearCart(req.user.id);
  }
}