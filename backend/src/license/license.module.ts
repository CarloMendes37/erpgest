import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { License } from './license.entity';
import { LicenseController } from './license.controller';
import { LicenseService } from './license.service';

@Module({
  imports: [TypeOrmModule.forFeature([License])],
  controllers: [LicenseController],
  providers: [LicenseService],
  exports: [LicenseService],
})
export class LicenseModule {}
