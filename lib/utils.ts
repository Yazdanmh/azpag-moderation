import { AxiosResponse } from "axios";
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { ResponseResult } from "./services";

type TryCatchOptions = {
    errorMessage?: string; // Custom error message
    logError?: boolean; // Whether to log errors to the console
};

export function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

export function safeRedirect(path: string | null | undefined, fallback: string): string {
  if (!path) return fallback;
  if (!path.startsWith('/')) return fallback;
  if (path.startsWith('//')) return fallback;
  try {
    const url = new URL(path, 'http://localhost');
    if (url.hostname !== 'localhost') return fallback;
  } catch {
    return fallback;
  }
  return path;
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const tryCatch = async <T>(
    axiosPromise: Promise<AxiosResponse<T>>,
    options: TryCatchOptions = {}
): Promise<ResponseResult<T>> => {
    const { errorMessage = 'An error occurred.', logError = true } = options;

    try {
        const response = await axiosPromise;

        // Return success data structure
        return {
            data: response.data,
            status: response.status,
            error: null // No error in success case
        };
    } catch (error: any) {
        if (logError && process.env.NODE_ENV === 'development') {
            console.error('[tryCatch]', errorMessage, error.response?.data || error.message);
        }

        // Return error data structure even when there's an issue with the response
        return {
            data: null, // Ensure `data` is null in case of error
            status: error.response?.status || null, // HTTP status code
            error: error.response?.data?.error || error?.message || 'Unknown error' // Provide error details
        };
    }
};