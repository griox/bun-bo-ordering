/**
 * Configuration for payment and QR generation
 * You can change your beneficiary account here
 */
export const PAYMENT_CONFIG = {
    // Beneficiary bank details
    BANK_BIN: '970415', // VietinBank BIN
    BANK_NAME: 'VietinBank',
    ACCOUNT_NO: '104876858916',
    ACCOUNT_NAME: 'NGO QUANG HUY',

    // QR Template from vietqr.io (compact, compact2, qr_only, etc.)
    QR_TEMPLATE: 'compact2',

    // Default App ID for quick opening (icb = VietinBank, vcb = Vietcombank, mbbank = MB Bank)
    DEFAULT_APP: 'icb'
};
