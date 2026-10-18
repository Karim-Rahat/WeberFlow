import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import type { ButtonHTMLAttributes } from 'react';
import { cn } from '../../lib/utils';

const buttonVariants = cva(
    'inline-flex items-center justify-center gap-2 rounded-xl text-sm font-semibold transition active:scale-[.98] focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-brand-100 disabled:pointer-events-none disabled:opacity-50 dark:focus-visible:ring-brand-900',
    {
        variants: {
            variant: {
                default: 'bg-brand-600 text-white shadow-sm hover:bg-brand-700 dark:bg-brand-300 dark:text-brand-900',
                outline: 'border border-[#dce3dc] bg-white hover:bg-[#eef1ea] dark:border-[#303a33] dark:bg-[#181d1a] dark:hover:bg-[#222a25]',
                ghost: 'hover:bg-[#eef1ea] dark:hover:bg-[#222a25]',
                danger: 'bg-[#b64545] text-white hover:bg-[#963939]',
            },
            size: {
                default: 'h-10 px-4',
                sm: 'h-9 px-3',
                icon: 'size-10',
            },
        },
        defaultVariants: { variant: 'default', size: 'default' },
    },
);

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof buttonVariants> & { asChild?: boolean };

export function Button({ className, variant, size, asChild = false, ...props }: ButtonProps) {
    const Component = asChild ? Slot : 'button';

    return <Component className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}
