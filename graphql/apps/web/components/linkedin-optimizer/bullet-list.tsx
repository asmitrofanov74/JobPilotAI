'use client';

type BulletListProps = {
  title: string;
  items: string[];
  dotColor?: string;
  titleClassName?: string;
};

export function BulletList({ title, items, dotColor = 'bg-blue-500', titleClassName = 'text-gray-700' }: BulletListProps) {
  if (!items?.length) return null;
  return (
    <div>
      <h3 className={`text-sm font-semibold ${titleClassName} mb-2`}>{title}</h3>
      <ul className="space-y-1.5">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
            <span className={`w-1.5 h-1.5 rounded-full ${dotColor} mt-1.5 shrink-0`} />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
