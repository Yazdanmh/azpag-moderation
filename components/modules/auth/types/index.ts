export type Credentials = {
    email: string;
    password: string;
    platform: string;
    access_level: string;
};

export type OTPType = 'verify-account' | 'change-password' | 'change-email' | 'delete-account' | 'reset-password' | undefined;