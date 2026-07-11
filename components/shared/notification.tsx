import { toast } from "sonner";
import { CheckCircle2, XCircle, Info } from "lucide-react";

type ToastAction = {
    label: string;
    onClick: () => void;
};

type ToastOptions = {
    title: string;
    description?: string;
    action?: ToastAction;
};

function baseToast(
    type: "success" | "error" | "info",
    { title, description, action }: ToastOptions
) {


    return toast[type](title, {
        description,
        position: 'top-center',
        ...(action && {
            action: {
                label: action.label,
                onClick: action.onClick,
            },
        }),
    });
}

export const notify = {
    success: (data: ToastOptions) => baseToast("success", data),
    error: (data: ToastOptions) => baseToast("error", data),
    info: (data: ToastOptions) => baseToast("info", data),
};