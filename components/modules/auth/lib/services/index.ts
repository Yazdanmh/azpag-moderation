import services from '@/lib/services';
import { Credentials, OTPType } from '../../types';

export const signIn = async (credentials: Credentials): Promise<any> => {
    return await services.create('/auth/login', credentials);
};

export const signOut = async () => {
    return await services.create('/auth/logout', null);
};

export const verifyOtp = async (
    type: OTPType,
    data: { email: string; code: string; new_email?: string; password?: string }
) => {
    let url = '/otp/verify';
    let payload: any = { email: data.email, code: data.code };

    if (type === 'change-password') {
        url = '/security/change-password';
        payload = { ...data, password: data.password };
    } else if (type === 'change-email') {
        url = '/security/change-email';
        payload = { ...data, new_email: data.new_email };
    } else if (type === 'verify-account') {
        url = '/security/verify-account';
    }

    return await services.create(url, payload);
};

export const resendOtp = async (email: string) => await services.create('/otp/send', { email });

export const restoreAccount = async (email: string) => await services.create('/users/me/restore', { email });

export const changeEmail = async (data: { password: string; id: string }) =>
    await services.update('/auth/change-email', data);

export const forgotPassword = async (data: { email: string, access_level: string }) => await services.create('/auth/forgot-password', data);

export const resetPassword = async (data: { password: string; email: string; code: string }) =>
    await services.create('/auth/reset-password', data);
