type BadgeProps = {
  children: React.ReactNode;
  variant?: 'gray' | 'blue' | 'green' | 'red' | 'amber' | 'purple' | 'orange' | 'emerald' | 'violet' | 'cyan';
  dot?: boolean;
};

const variants = {
  gray: 'bg-gray-100 text-gray-700',
  blue: 'bg-blue-100 text-blue-700',
  green: 'bg-green-100 text-green-700',
  red: 'bg-red-100 text-red-700',
  amber: 'bg-amber-100 text-amber-700',
  purple: 'bg-purple-100 text-purple-700',
  orange: 'bg-orange-100 text-orange-700',
  emerald: 'bg-emerald-100 text-emerald-700',
  violet: 'bg-violet-100 text-violet-700',
  cyan: 'bg-cyan-100 text-cyan-700',
};

export function Badge({ children, variant = 'gray', dot }: BadgeProps) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-medium ${variants[variant]}`}>
      {dot && <span className="w-1.5 h-1.5 rounded-full bg-current opacity-60" />}
      {children}
    </span>
  );
}
