export function useToast() {
  const toast = ({ title, description, variant }: {
    title: string;
    description?: string;
    variant?: 'default' | 'destructive';
  }) => {
    const message = description ? `${title}: ${description}` : title;
    if (typeof window !== 'undefined') {
      if (variant === 'destructive') {
        window.alert(`Error: ${message}`);
      } else {
        window.alert(`Success: ${message}`);
      }
    }
  };

  return { toast };
}
