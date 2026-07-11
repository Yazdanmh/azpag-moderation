import React from 'react';

import { cn } from '@/lib/utils';

import { type VariantProps, cva } from 'class-variance-authority';

const wrapperVariants = cva('mx-auto w-full max-w-7xl  p-2', {
    variants: {
        align: {
            left: 'gird h-screen w-screen place-content-center items-start',
            center: 'gird h-screen w-screen place-content-center items-center',
            right: 'gird h-screen w-screen place-content-center items-end',
            default: ''
        }
    },
    defaultVariants: {
        align: 'default'
    }
});

export interface WrapperProps {
    children: React.ReactNode;
    align?: VariantProps<typeof wrapperVariants>['align'];
    className?: string;
    asChild?: boolean;
}

const MainWrapper = React.forwardRef<HTMLDivElement, WrapperProps>(
    ({ className, asChild = false, children, align, ...props }, ref): React.JSX.Element => (
        <main id='main-wrapper' className={cn(wrapperVariants({ align, className }))}>
            {children}
        </main>
    )
);

const DashboardWrapper = ({ children }: WrapperProps) => {
    return <div className='mx-auto w-full max-w-7xl px-6 py-4'>{children}</div>;
};

MainWrapper.displayName = 'MainWrapper';

export { MainWrapper };
