import { Loader2 } from 'lucide-react';

export default function MenuLoading() {
    return (
        <div className="flex h-screen w-full flex-col items-center justify-center bg-background">
            <div className="relative">
                <Loader2 className="w-16 h-16 animate-spin text-primary relative z-10" />
                <div className="absolute inset-0 w-16 h-16 bg-primary/20 blur-xl animate-pulse" />
            </div>
            <p className="mt-6 text-xl font-display text-text animate-pulse uppercase tracking-widest">
                Đang chuẩn bị thực đơn...
            </p>
        </div>
    );
}
