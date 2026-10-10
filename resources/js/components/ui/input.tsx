import type { InputHTMLAttributes } from 'react';
import { cn } from '../../lib/utils';

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
    return <input className={cn('h-11 w-full rounded-xl border border-[#dce3dc] bg-white px-3.5 text-sm outline-none transition placeholder:text-[#8c958f] focus:border-brand-500 focus:ring-3 focus:ring-brand-100 dark:border-[#303a33] dark:bg-[#181d1a] dark:focus:ring-brand-900', className)} {...props} />;
}
