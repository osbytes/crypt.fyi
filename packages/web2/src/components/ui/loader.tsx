interface LoaderProps {
    size?: "sm" | "default" | "lg"
}

export function Loader({ size = "default" }: LoaderProps) {
    const sizeClasses = {
        sm: "h-3 w-3",
        default: "h-4 w-4",
        lg: "h-5 w-5"
    }

    return <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        <svg
            className={`animate-spin ${sizeClasses[size]}`}
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
        >
            <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
            />
            <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
        </svg>
    </span>
}
