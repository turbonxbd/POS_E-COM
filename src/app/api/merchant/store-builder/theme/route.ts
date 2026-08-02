import { validateMerchantApiAccess } from '../../../../../core/auth/merchant-guard';
import { storefrontThemeService } from '../../../../../features/store-builder/services/theme.service';

export async function GET(request: Request) {
  try {
    const auth = await validateMerchantApiAccess(request);
    if (!auth.isAuthorized || !auth.merchantId) {
      return new Response(
        JSON.stringify({ success: false, error: auth.error }),
        { status: auth.statusCode || 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const theme = await storefrontThemeService.getStorefrontTheme(auth.merchantId);

    return new Response(
      JSON.stringify({ success: true, data: theme }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ success: false, error: error.message || 'Failed to fetch storefront theme.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const auth = await validateMerchantApiAccess(request);
    if (!auth.isAuthorized || !auth.merchantId) {
      return new Response(
        JSON.stringify({ success: false, error: auth.error }),
        { status: auth.statusCode || 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const body = await request.json();
    const { branding, colorsAndFonts, headerStyle, footerStyle } = body;

    let updatedTheme = await storefrontThemeService.getStorefrontTheme(auth.merchantId);

    if (branding) {
      updatedTheme = await storefrontThemeService.updateBranding(auth.merchantId, branding);
    }
    if (colorsAndFonts) {
      updatedTheme = await storefrontThemeService.updateThemeColorsAndFonts(auth.merchantId, colorsAndFonts);
    }
    if (headerStyle || footerStyle) {
      updatedTheme = await storefrontThemeService.updateHeaderFooterStyle(auth.merchantId, headerStyle, footerStyle);
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Theme configuration updated.', data: updatedTheme }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ success: false, error: error.message || 'Failed to update storefront theme.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
