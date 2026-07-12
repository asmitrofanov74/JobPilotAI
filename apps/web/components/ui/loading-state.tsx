import { Spinner } from './spinner';

type LoadingStateProps = {
  padding?: 'sm' | 'md' | 'lg';
};

export function LoadingState({ padding = 'lg' }: LoadingStateProps) {
  const paddings = { sm: 'py-12', md: 'py-16', lg: 'py-20' };
  return (
    <div className={`flex justify-center ${paddings[padding]}`}>
      <Spinner />
    </div>
  );
}
