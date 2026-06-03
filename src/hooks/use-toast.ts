import { useToastContext } from '@/contexts/ToastContext';

export function useToast() {
  const { toast: contextToast } = useToastContext();

  const toast = ({ title, description, variant }: {
    title: string;
    description?: string;
    variant?: 'default' | 'destructive' | 'success';
  }) => {
    contextToast({ title, description, variant });
  };

  return { toast };
}
