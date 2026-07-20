import { Module } from '@nestjs/common';
import { PairingService } from './pairing.service';
import { PairingLockoutService } from './pairing-lockout.service';

@Module({
  providers: [PairingService, PairingLockoutService],
  exports: [PairingService, PairingLockoutService],
})
export class PairingModule {}
