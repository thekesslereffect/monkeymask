import React from 'react';
import { AvatarType } from './AvatarToggle';
interface AvatarProps {
    address: string;
    size?: number;
    className?: string;
    avatarType?: AvatarType;
}
export declare const Avatar: React.FC<AvatarProps>;
export {};
