'use client';

import { FC, useEffect, useState } from 'react';

import { cn } from '@/lib/utils';

import * as FaIcons from 'react-icons/fa6';
import * as FcIcons from 'react-icons/fc';
import * as LuIcons from 'react-icons/lu';

/* eslint-disable import/namespace */

export type IconProps = {
    alt?: string;
    name: keyof typeof FcIcons | keyof typeof LuIcons | keyof typeof FaIcons;
    size?: number;
    className?: React.HTMLProps<HTMLElement>['className'];
    isLoading?: boolean;
    onClick?: () => void;
};

export const Icon: FC<IconProps> = ({ name, size = 24, isLoading, alt, className, ...props }) => {
    // State to track if it's client-side rendering
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        // Update the state after the first render (client-side only)
        setIsClient(true);
    }, []);

    // If it's not client-side, return null to prevent hydration issues
    if (!isClient) {
        return null;
    }

    // Safely select the correct icon set and cast `name` to a valid key
    const IconComponent = name.toString().startsWith('Fc')
        ? (FcIcons[name as keyof typeof FcIcons] as React.ElementType)
        : name.toString().startsWith('Lu')
            ? (LuIcons[name as keyof typeof LuIcons] as React.ElementType)
            : (FaIcons[name as keyof typeof FaIcons] as React.ElementType);

    return IconComponent ? (
        <IconComponent size={size} className={cn(isLoading ? 'animate-spin' : className)} aria-label={alt} {...props} />
    ) : null;
};
