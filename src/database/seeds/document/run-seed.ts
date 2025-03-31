import { NestFactory } from '@nestjs/core';
import { UserSeedService } from './user/user-seed.service';
import { VendorSeedService } from './vendor/vendor-seed.service';
import { ProductSeedService } from './product/product-seed.service';
import { SeedModule } from './seed.module';

const runSeed = async () => {
  const app = await NestFactory.create(SeedModule);
  
  // Run seeds in order (users -> vendors -> products)
  await app.get(UserSeedService).run();
  await app.get(VendorSeedService).run();
  await app.get(ProductSeedService).run();


  await app.close();
};

void runSeed();