import type { HTMLAttributes } from 'react';
import { cn } from '../../lib/utils';

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
    return <div className={cn('rounded-2xl border border-[#dce3dc] bg-white shadow-[0_8px_24px_rgba(25,50,36,.05)] dark:border-[#303a33] dark:bg-[#181d1a]', className)} {...props} />;
}
