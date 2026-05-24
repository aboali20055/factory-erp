import { cn } from '../../utils';
import { Loader2 } from 'lucide-react';
import type { ButtonHTMLAttributes, InputHTMLAttributes, SelectHTMLAttributes, ReactNode } from 'react';

// ── Button ────────────────────────────────────────

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  children,
  className,
  disabled,
  ...props
}: ButtonProps) {
  const base = 'inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

  const variants = {
    primary: 'bg-indigo-600 hover:bg-indigo-700 text-white focus-visible:ring-indigo-500',
    secondary: 'bg-gray-100 hover:bg-gray-200 text-gray-700 focus-visible:ring-gray-400',
    danger: 'bg-red-600 hover:bg-red-700 text-white focus-visible:ring-red-500',
    ghost: 'hover:bg-gray-100 text-gray-600 focus-visible:ring-gray-400',
    outline: 'border border-gray-300 hover:bg-gray-50 text-gray-700 focus-visible:ring-gray-400',
  };

  const sizes = {
    sm: 'text-xs px-3 py-1.5',
    md: 'text-sm px-4 py-2',
    lg: 'text-base px-5 py-2.5',
  };

  return (
    <button
      className={cn(base, variants[variant], sizes[size], className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <Loader2 size={14} className="animate-spin" /> : icon}
      {children}
    </button>
  );
}

// ── Input ─────────────────────────────────────────

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export function Input({ label, error, hint, className, id, ...props }: InputProps) {
  const inputId = id ?? label;
  return (
    <div className="space-y-1">
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-gray-700">
          {label}
          {props.required && <span className="text-red-500 mr-1">*</span>}
        </label>
      )}
      <input
        id={inputId}
        className={cn(
          'block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm placeholder:text-gray-400',
          'focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent',
          'disabled:bg-gray-50 disabled:text-gray-500',
          error && 'border-red-500 focus:ring-red-500',
          className,
        )}
        {...props}
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
      {hint && !error && <p className="text-xs text-gray-500">{hint}</p>}
    </div>
  );
}

// ── Select ────────────────────────────────────────

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string | number; label: string }[];
  placeholder?: string;
}

export function Select({ label, error, options, placeholder, className, id, ...props }: SelectProps) {
  const selectId = id ?? label;
  return (
    <div className="space-y-1">
      {label && (
        <label htmlFor={selectId} className="block text-sm font-medium text-gray-700">
          {label}
          {props.required && <span className="text-red-500 mr-1">*</span>}
        </label>
      )}
      <select
        id={selectId}
        className={cn(
          'block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm bg-white',
          'focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent',
          error && 'border-red-500 focus:ring-red-500',
          className,
        )}
        {...props}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}

// ── Badge ─────────────────────────────────────────

type BadgeVariant = 'green' | 'red' | 'yellow' | 'blue' | 'gray' | 'purple' | 'success' | 'danger' | 'warning' | 'default';

export function Badge({ children, variant = 'gray' }: { children: ReactNode; variant?: BadgeVariant }) {
  const variants: Record<BadgeVariant, string> = {
    green: 'bg-emerald-100 text-emerald-700',
    red: 'bg-red-100 text-red-700',
    yellow: 'bg-amber-100 text-amber-700',
    blue: 'bg-blue-100 text-blue-700',
    gray: 'bg-gray-100 text-gray-600',
    purple: 'bg-purple-100 text-purple-700',
    success: 'bg-emerald-100 text-emerald-700',
    danger: 'bg-red-100 text-red-700',
    warning: 'bg-amber-100 text-amber-700',
    default: 'bg-gray-100 text-gray-600',
  };
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium', variants[variant])}>
      {children}
    </span>
  );
}

// ── Stat Card ─────────────────────────────────────

interface StatCardProps {
  title: string;
  value: number | string;
  subtitle?: string;
  icon: ReactNode;
  colorClass?: string;
  color?: string;
  trend?: 'up' | 'down' | 'neutral';
}

const COLOR_MAP: Record<string, string> = {
  blue: 'bg-blue-500', green: 'bg-emerald-500', red: 'bg-red-500',
  yellow: 'bg-amber-500', purple: 'bg-purple-500', indigo: 'bg-indigo-500',
  gray: 'bg-gray-500',
};

export function StatCard({ title, value, subtitle, icon, colorClass, color, trend }: StatCardProps) {
  const bgClass = colorClass ?? (color ? (COLOR_MAP[color] ?? 'bg-indigo-500') : 'bg-indigo-500');
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-sm text-gray-500 truncate">{title}</p>
          <p className={cn(
            'text-2xl font-bold mt-1 tabular-nums',
            trend === 'up' ? 'text-emerald-600' : trend === 'down' ? 'text-red-600' : 'text-gray-800',
          )}>
            {typeof value === 'number' ? value.toLocaleString('ar-EG') : value}
          </p>
          {subtitle && <p className="text-xs text-gray-400 mt-1 truncate">{subtitle}</p>}
        </div>
        <div className={cn('w-11 h-11 rounded-xl flex items-center justify-center text-white flex-shrink-0', bgClass)}>
          {icon}
        </div>
      </div>
    </div>
  );
}

// ── Loading Spinner ───────────────────────────────

export function LoadingSpinner({ text = 'جاري التحميل...', size }: { text?: string; size?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3">
      <Loader2 className="animate-spin text-indigo-500" size={32} />
      <p className="text-sm text-gray-500">{text}</p>
    </div>
  );
}

// ── Empty State ───────────────────────────────────

export function EmptyState({ title, description, icon }: { title: string; description?: string; icon?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
      {icon && <div className="text-gray-300 mb-2">{icon}</div>}
      <h3 className="font-semibold text-gray-500">{title}</h3>
      {description && <p className="text-sm text-gray-400 max-w-xs">{description}</p>}
    </div>
  );
}

// ── Table ─────────────────────────────────────────

export function Table({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('overflow-x-auto rounded-xl border border-gray-200', className)}>
      <table className="w-full text-sm">{children}</table>
    </div>
  );
}

export function Th({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <th className={cn('px-4 py-3 text-right font-semibold text-gray-600 bg-gray-50 border-b border-gray-200 whitespace-nowrap', className)}>
      {children}
    </th>
  );
}

export function Td({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <td className={cn('px-4 py-3 text-gray-700 border-b border-gray-100 last:border-0', className)}>
      {children}
    </td>
  );
}
