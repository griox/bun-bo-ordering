'use client';
import { User, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/useAuthStore';
import { useTranslations, useLocale } from 'next-intl';
import { usePathname, useRouter } from '@/i18n/routing';

interface TopbarProps {
    onToggleSidebar?: () => void;
}

export function Topbar({ onToggleSidebar }: TopbarProps) {
    const { user } = useAuthStore();
    const t = useTranslations('Topbar');
    const locale = useLocale();
    const router = useRouter();
    const pathname = usePathname();

    const switchLocale = (nextLocale: string) => {
        if (nextLocale !== locale) {
            router.replace(pathname, { locale: nextLocale });
        }
    };

    return (
        <header className="h-16 bg-white border-b border-gray-100 px-4 md:px-8 flex items-center justify-between sticky top-0 z-30 transition-all">
            <div className="flex items-center gap-4">
                <Button
                    variant="ghost"
                    size="icon"
                    className="lg:hidden min-h-[44px] min-w-[44px] text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-xl"
                    onClick={onToggleSidebar}
                >
                    <Menu className="size-5" />
                </Button>

                <h1 className="hidden md:block text-lg font-bold text-gray-900 tracking-tight">{t('title')}</h1>
            </div>

            <div className="flex items-center gap-4">

                <div className="flex items-center bg-gray-100 p-1 rounded-full border border-gray-200 shadow-inner">
                    <button
                        onClick={() => switchLocale('vi')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-full transition-all duration-300 ${locale === 'vi' ? 'bg-white text-primary shadow-sm scale-100' : 'text-gray-500 hover:text-gray-700 scale-95'}`}
                    >
                        <span>🇻🇳</span>
                        <span>VN</span>
                    </button>
                    <button
                        onClick={() => switchLocale('en')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-full transition-all duration-300 ${locale === 'en' ? 'bg-white text-primary shadow-sm scale-100' : 'text-gray-500 hover:text-gray-700 scale-95'}`}
                    >
                        <span>🇬🇧</span>
                        <span>EN</span>
                    </button>
                </div>

                <div className="h-6 w-px bg-gray-100 mx-1" />

                <div className="flex items-center gap-3 pl-1 group cursor-pointer">
                    <div className="text-right hidden sm:block">
                        <p className="text-sm font-bold text-gray-900 leading-none mb-1">{user?.username || 'Admin'}</p>
                        <p className="text-xs text-gray-400 font-medium">{user?.role || 'Administrator'}</p>
                    </div>
                    <div className="min-h-[44px] min-w-[44px] rounded-full bg-gray-100 text-gray-500 flex items-center justify-center border-2 border-transparent group-hover:border-primary/20 transition-all overflow-hidden">
                        <User className="size-5" />
                    </div>
                </div>
            </div>
        </header>
    );
}
