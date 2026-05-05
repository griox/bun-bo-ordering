import { Loader2 } from 'lucide-react';

export default function AdminLoading() {
    return (
        <div className="flex h-full w-full flex-col items-center justify-center py-20">
            <div className="relative">
                <Loader2 className="w-12 h-12 animate-spin text-gray-900 relative z-10" />
                <div className="absolute inset-0 w-12 h-12 bg-gray-900/10 blur-xl animate-pulse" />
            </div>
            <p className="mt-4 text-xs font-bold text-gray-400 uppercase tracking-widest">
                Đang tải dữ liệu quản trị...
            </p>
        </div>
    );
}
