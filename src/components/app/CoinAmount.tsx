'use client';

interface CoinAmountProps {
  amount: number;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showIcon?: boolean;
  className?: string;
}

export default function CoinAmount({
  amount,
  size = 'md',
  showIcon = true,
  className = '',
}: CoinAmountProps) {
  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-3xl',
  };

  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      {showIcon && (
        <span className={`${size === 'sm' ? 'text-xs' : size === 'xl' ? 'text-2xl' : 'text-sm'}`}>
          💰
        </span>
      )}
      <span className={`font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent ${sizeClasses[size]}`}>
        ₹{amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </span>
    </div>
  );
}
