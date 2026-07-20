import { Controller, Get, Param, Res } from '@nestjs/common';
import { readFile } from 'fs/promises';
import type { Response } from 'express';
import { PlatformSettingsService } from './platform-settings.service';
import { BrandingAssetsService } from './branding-assets.service';
import { PUBLIC_ROUTES } from '../../common/constants/route-prefixes';

export type PublicBrandingDto = {
  platformName: string;
  brandingEpoch: number;
  logoUrlEn: string;
  logoUrlAr: string;
  hasAssetEnLight: boolean;
  hasAssetEnDark: boolean;
  hasAssetArLight: boolean;
  hasAssetArDark: boolean;
};

@Controller({ path: [...PUBLIC_ROUTES.BRANDING] })
export class BrandingController {
  constructor(
    private readonly brandingAssets: BrandingAssetsService,
    private readonly settings: PlatformSettingsService,
  ) {}

  @Get()
  async getBranding(): Promise<PublicBrandingDto> {
    const s = await this.settings.getSettings();
    return {
      platformName: s.platformName,
      brandingEpoch: s.brandingEpoch ?? 0,
      logoUrlEn: s.logoUrlEn ?? '',
      logoUrlAr: s.logoUrlAr ?? '',
      hasAssetEnLight: Boolean(s.logoAssetEnLight?.trim()),
      hasAssetEnDark: Boolean(s.logoAssetEnDark?.trim()),
      hasAssetArLight: Boolean(s.logoAssetArLight?.trim()),
      hasAssetArDark: Boolean(s.logoAssetArDark?.trim()),
    };
  }

  @Get('file/:variant')
  async getFile(
    @Param('variant') variant: string,
    @Res({ passthrough: false }) res: Response,
  ): Promise<void> {
    try {
      const { absPath, mime } =
        await this.brandingAssets.resolveAbsolutePath(variant);
      const buf = await readFile(absPath);
      res.setHeader('Content-Type', mime);
      res.setHeader('Cache-Control', 'public, max-age=300');
      res.send(buf);
    } catch {
      res.status(404).end();
    }
  }
}
