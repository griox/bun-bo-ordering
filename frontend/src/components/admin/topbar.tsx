'use client';
import { User, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/useAuthStore';

interface TopbarProps {
    onToggleSidebar?: () => void;
}

export function Topbar({ onToggleSidebar }: TopbarProps) {
    const { user } = useAuthStore();

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

                <h1 className="hidden md:block text-lg font-bold text-gray-900 tracking-tight">Trang quản trị</h1>
            </div>

            <div className="flex items-center gap-4">


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
