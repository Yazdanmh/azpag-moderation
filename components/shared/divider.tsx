import React from 'react';

import { cn } from '@/lib/utils';

interface DividerProps {
    text?: string; // Optional text to display in the middle of the divider
    className?: React.HTMLProps<HTMLElement>['className'];
    textClass?: React.HTMLProps<HTMLElement>['className'];
}

const Divider: React.FC<DividerProps> = ({ text, className, textClass }) => {
    return (
        <div className={cn('flex items-center justify-center', className)}>
            <div className='flex-grow border-t border-gray-300 dark:border-gray-600'></div>
            {text && <span className={cn('px-4 text-sm text-gray-500 dark:text-gray-300', textClass)}>{text}</span>}
            <div className='flex-grow border-t border-gray-300 dark:border-gray-600'></div>
        </div>
    );
};

export default Divider;
