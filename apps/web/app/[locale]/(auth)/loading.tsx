import { Spinner } from '@/components/ui/spinner';

export default function AuthLoading() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <Spinner className="w-10 h-10" />
    </div>
  );
}
