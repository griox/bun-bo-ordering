import { Facebook, Instagram, MapPin, Phone } from "lucide-react";
import { useTranslations } from 'next-intl';

export function Footer() {
    const t = useTranslations('Landing.Footer');
    return (
        <footer className="bg-[#2D2D2D] text-white pt-10 md:pt-16 pb-6 md:pb-8">
            <div className="container mx-auto px-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 mb-8 md:mb-12">
                    {/* Brand */}
                    <div>
                        <h3 className="font-display text-2xl text-primary mb-3 md:mb-4">BÚN BÒ & CÀ PHÊ PHỐ</h3>
                        <p className="font-main text-sm md:text-base text-gray-400 mb-4 md:mb-6">
                            {t('desc')}
                        </p>
                        <div className="flex gap-4">
                            <a href="#" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-primary transition-colors">
                                <Facebook size={20} />
                            </a>
                            <a href="#" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-primary transition-colors">
                                <Instagram size={20} />
                            </a>
                        </div>
                    </div>

                    {/* Contact */}
                    <div>
                        <h4 className="font-display text-xl mb-4">{t('contact')}</h4>
                        <ul className="space-y-4 font-main text-gray-400">
                            <li className="flex items-start gap-3">
                                <MapPin className="mt-1 flex-shrink-0 text-primary" size={20} />
                                <span>{t('address')}</span>
                            </li>
                            <li className="flex items-center gap-3">
                                <Phone className="flex-shrink-0 text-primary" size={20} />
                                <span>0978 335 334</span>
                            </li>
                        </ul>
                    </div>

                    {/* Hours */}
                    <div>
                        <h4 className="font-display text-xl mb-4">{t('hoursTitle')}</h4>
                        <ul className="space-y-2 font-main text-gray-400">
                            <li className="flex justify-between border-b border-gray-700 pb-2">
                                <span>{t('hours')}</span>
                                <span className="text-white">6:00 - 12:00</span>
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="border-t border-gray-700 pt-8 text-center text-sm text-gray-500 font-main">
                    <p>&copy; 2026 Bun Bo Hue Xua System. All rights reserved.</p>
                </div>
            </div>
        </footer>
    );
}
