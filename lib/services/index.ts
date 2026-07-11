import { tryCatch, getCookie } from '../utils';
import axios from 'axios';

export type ResponseResult<T> = {
    data: T | null;
    status: number | null;
    error: any | null;
};

const CSRF_HEADER_NAME = 'X-CSRFToken';

const csrfSafeMethods = new Set(['GET', 'HEAD', 'OPTIONS', 'TRACE']);

function isMutatingRequest(method?: string): boolean {
    return !method || !csrfSafeMethods.has(method.toUpperCase());
}

const axiosInstance = axios.create({
    baseURL: process.env.NEXTAUTH_URL || '',
    timeout: 30000,
    headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
    }
});

// Axios request interceptor for CSRF protection (double-submit cookie pattern)
axiosInstance.interceptors.request.use(
    (config) => {
        if (isMutatingRequest(config.method)) {
            const csrfToken = getCookie('csrftoken');
            if (csrfToken) {
                config.headers[CSRF_HEADER_NAME] = csrfToken;
            }
        }

        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

const services = {
    create: async <T>(url: string, data: any): Promise<ResponseResult<T>> => {
        return tryCatch(axiosInstance.post<T>(`/api/proxy${url}`, data));
    },

    read: async <T>(url: string): Promise<ResponseResult<T>> => {
        return tryCatch(axiosInstance.get<T>(`/api/proxy${url}`));
    },

    update: async <T>(url: string, data: any): Promise<ResponseResult<T>> => {
        return tryCatch(axiosInstance.put<T>(`/api/proxy${url}`, data));
    },
    patch: async <T>(url: string, data: any): Promise<ResponseResult<T>> => {
        return tryCatch(axiosInstance.patch<T>(`/api/proxy${url}`, data));
    },
    delete: async <T>(url: string): Promise<ResponseResult<T>> => {
        return tryCatch(axiosInstance.delete<T>(`/api/proxy${url}`));
    },

    upload: async <T>(url: string, data: FormData): Promise<ResponseResult<T>> => {
        return tryCatch(
            axiosInstance.post<T>(`/api/proxy${url}`, data, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            })
        );
    }
};

export default services;
