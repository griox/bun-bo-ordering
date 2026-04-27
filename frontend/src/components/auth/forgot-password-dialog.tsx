'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useForgotPasswordMutation, useResetPasswordMutation } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
    InputOTP,
    InputOTPGroup,
    InputOTPSlot,
} from '@/components/ui/input-otp';
import { Loader2, KeyRound, Mail } from 'lucide-react';

const emailSchema = z.object({
    email: z.string().min(1, 'Vui lòng nhập email').email('Email không hợp lệ'),
});

const resetSchema = z.object({
    otpCode: z.string().length(6, 'Mã OTP phải có 6 chữ số'),
    newPassword: z.string().min(6, 'Mật khẩu phải ít nhất 6 ký tự'),
    confirmPassword: z.string().min(1, 'Vui lòng xác nhận mật khẩu'),
}).refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Mật khẩu không khớp',
    path: ['confirmPassword'],
});

type Step = 'EMAIL' | 'OTP_RESET';

export function ForgotPasswordDialog() {
    const [open, setOpen] = useState(false);
    const [step, setStep] = useState<Step>('EMAIL');
    const [email, setEmail] = useState('');

    const emailForm = useForm<z.infer<typeof emailSchema>>({
        resolver: zodResolver(emailSchema),
        defaultValues: { email: '' },
    });

    const resetForm = useForm<z.infer<typeof resetSchema>>({
        resolver: zodResolver(resetSchema),
        defaultValues: { otpCode: '', newPassword: '', confirmPassword: '' },
    });

    const forgotPasswordMutation = useForgotPasswordMutation(() => {
        setStep('OTP_RESET');
    }, (errData: any) => {
        if (errData?.errors?.Email) {
            emailForm.setError('email', { message: errData.errors.Email[0] });
        }
    });

    const resetPasswordMutation = useResetPasswordMutation(() => {
        setOpen(false);
        setStep('EMAIL');
        emailForm.reset();
        resetForm.reset();
    }, (errData: any) => {
        if (errData?.errors) {
            Object.keys(errData.errors).forEach((key) => {
                const fieldName = key.charAt(0).toLowerCase() + key.slice(1) as any;
                resetForm.setError(fieldName, {
                    type: 'manual',
                    message: errData.errors[key][0],
                });
            });
        }
    });

    const onEmailSubmit = (data: z.infer<typeof emailSchema>) => {
        setEmail(data.email);
        forgotPasswordMutation.mutate(data);
    };

    const onResetSubmit = (data: z.infer<typeof resetSchema>) => {
        resetPasswordMutation.mutate({
            email,
            otpCode: data.otpCode,
            newPassword: data.newPassword,
        });
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <button
                    type="button"
                    className="ml-auto mr-4 text-[10px] font-black italic underline text-black tracking-widest hover:text-primary transition-colors"
                >
                    QUÊN?
                </button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[450px] border-4 border-black rounded-3xl shadow-[8px_8px_0px_#000000] p-0 overflow-hidden bg-white">
                <div className="bg-primary p-6 text-white border-b-4 border-black">
                    <DialogHeader>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="bg-black p-2 rounded-xl">
                                <KeyRound className="w-6 h-6 text-primary" />
                            </div>
                            <DialogTitle className="text-3xl font-display font-black uppercase tracking-tighter">
                                Khôi phục mật khẩu
                            </DialogTitle>
                        </div>
                        <DialogDescription className="text-white/90 font-bold italic text-sm">
                            {step === 'EMAIL'
                                ? 'Nhập email để nhận mã xác thực OTP'
                                : 'Nhập mã OTP và mật khẩu mới của bạn'}
                        </DialogDescription>
                    </DialogHeader>
                </div>

                <div className="p-8">
                    {step === 'EMAIL' ? (
                        <Form {...emailForm}>
                            <form onSubmit={emailForm.handleSubmit(onEmailSubmit)} className="space-y-6">
                                <FormField
                                    control={emailForm.control}
                                    name="email"
                                    render={({ field }) => (
                                        <FormItem className="space-y-3">
                                            <FormLabel className="text-xs font-black uppercase tracking-[0.2em] text-black flex items-center gap-2">
                                                <Mail className="w-4 h-4" /> Email của bạn
                                            </FormLabel>
                                            <FormControl>
                                                <Input
                                                    placeholder="nva@example.com"
                                                    className="h-14 border-2 border-black font-bold rounded-2xl shadow-[2px_2px_0px_#000000] focus-visible:ring-0 focus-visible:border-primary transition-all px-6"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage className="text-[10px] font-bold uppercase italic text-red-500" />
                                        </FormItem>
                                    )}
                                />
                                <Button
                                    type="submit"
                                    disabled={forgotPasswordMutation.isPending}
                                    className="w-full h-14 bg-black text-white font-display font-black text-lg uppercase tracking-widest rounded-2xl border-2 border-black hover:bg-neutral-800 transition-all shadow-[4px_4px_0px_rgba(0,0,0,0.2)] active:translate-y-[2px] active:shadow-none"
                                >
                                    {forgotPasswordMutation.isPending ? (
                                        <>
                                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                            ĐANG GỬI...
                                        </>
                                    ) : (
                                        'GỬI MÃ XÁC THỰC'
                                    )}
                                </Button>
                            </form>
                        </Form>
                    ) : (
                        <Form {...resetForm}>
                            <form onSubmit={resetForm.handleSubmit(onResetSubmit)} className="space-y-6">
                                <FormField
                                    control={resetForm.control}
                                    name="otpCode"
                                    render={({ field }) => (
                                        <FormItem className="space-y-4 text-center">
                                            <FormLabel className="text-xs font-black uppercase tracking-[0.2em] text-black">
                                                Mã xác thực OTP (6 chữ số)
                                            </FormLabel>
                                            <FormControl>
                                                <div className="flex justify-center">
                                                    <InputOTP
                                                        maxLength={6}
                                                        {...field}
                                                    >
                                                        <InputOTPGroup className="gap-2">
                                                            {Array.from({ length: 6 }).map((_, i) => (
                                                                <InputOTPSlot
                                                                    key={i}
                                                                    index={i}
                                                                    className="w-12 h-14 border-2 border-black rounded-xl font-black text-xl shadow-[2px_2px_0px_#000000]"
                                                                />
                                                            ))}
                                                        </InputOTPGroup>
                                                    </InputOTP>
                                                </div>
                                            </FormControl>
                                            <FormMessage className="text-[10px] font-bold uppercase italic text-red-500" />
                                        </FormItem>
                                    )}
                                />

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <FormField
                                        control={resetForm.control}
                                        name="newPassword"
                                        render={({ field }) => (
                                            <FormItem className="space-y-2">
                                                <FormLabel className="text-[10px] font-black uppercase tracking-widest text-black">Mật khẩu mới</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type="password"
                                                        placeholder="••••••"
                                                        className="h-12 border-2 border-black font-bold rounded-xl shadow-[2px_2px_0px_#000000] focus-visible:ring-0 transition-all"
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage className="text-[9px] font-bold uppercase italic text-red-500" />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={resetForm.control}
                                        name="confirmPassword"
                                        render={({ field }) => (
                                            <FormItem className="space-y-2">
                                                <FormLabel className="text-[10px] font-black uppercase tracking-widest text-black">Xác nhận</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type="password"
                                                        placeholder="••••••"
                                                        className="h-12 border-2 border-black font-bold rounded-xl shadow-[2px_2px_0px_#000000] focus-visible:ring-0 transition-all"
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage className="text-[9px] font-bold uppercase italic text-red-500" />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <div className="flex flex-col gap-3">
                                    <Button
                                        type="submit"
                                        disabled={resetPasswordMutation.isPending}
                                        className="w-full h-14 bg-primary text-white font-display font-black text-lg uppercase tracking-widest rounded-2xl border-2 border-black hover:bg-neutral-800 transition-all shadow-[4px_4px_0px_#000000] active:translate-y-[2px] active:shadow-none"
                                    >
                                        {resetPasswordMutation.isPending ? (
                                            <>
                                                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                                ĐANG CẬP NHẬT...
                                            </>
                                        ) : (
                                            'ĐẶT LẠI MẬT KHẨU'
                                        )}
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        onClick={() => setStep('EMAIL')}
                                        className="text-[10px] font-black uppercase tracking-widest underline underline-offset-4"
                                    >
                                        Gửi lại mã xác thực?
                                    </Button>
                                </div>
                            </form>
                        </Form>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
