const Button = ({
    label = "Click me",
    type = "button",
    variant = "primary",
    size = "medium",
    disabled = false,
    onClick,
    className = ""
}) => {
    const baseClasses = "font-medium rounded-lg transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white disabled:opacity-50 disabled:cursor-not-allowed";

    const variantClasses = {
        primary: "bg-gradient-to-r from-[#3B82F6] to-[#60A5FA] text-white hover:from-[#2563EB] hover:to-[#3B82F6] focus:ring-[#3B82F6] shadow-lg shadow-[#3B82F6]/20 hover:shadow-[#3B82F6]/40",
        secondary: "glass text-gray-700 hover:bg-gray-100 hover:text-gray-900 border border-gray-200 focus:ring-gray-300",
        outline: "border-2 border-[#3B82F6] text-[#3B82F6] hover:bg-[#3B82F6]/10 focus:ring-[#3B82F6]"
    };
    
    const sizeClasses = {
        small: "px-4 py-2 text-sm",
        medium: "px-6 py-3 text-base",
        large: "px-8 py-4 text-lg"
    };
    
    return (
        <button
            type={type}
            className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
            disabled={disabled}
            onClick={onClick}
        >
            {label}
        </button>
    );
};

export default Button;
