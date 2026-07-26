import { Spinner } from '@/components/ui/spinner';

export default function DashboardLoading() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Spinner className="w-10 h-10" />
    </div>
  );
}
