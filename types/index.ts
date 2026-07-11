import { IconProps } from "@/components/shared/icon";

export interface INavItem {
    href: string;
    title?: string;
    icon?: IconProps['name'];
    disabled?: boolean;
    access?: string[];
    children?: INavItem[];
}