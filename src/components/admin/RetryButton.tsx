import { useState, useCallback } from "react";

interface RetryButtonProps {
  onRetry: () => Promise<unknown>;
  disabled?: boolean;
}

export function RetryButton({ onRetry, disabled = false }: RetryButtonProps) {
  const [isRetrying, setIsRetrying] = useState(false);

  const handleClick = useCallback(async () => {
    if (isRetrying || disabled) return;

    setIsRetrying(true);
    try {
      await onRetry();
    } catch (err) {
      console.error(err);
    } finally {
      setIsRetrying(false);
    }
  }, [onRetry, isRetrying, disabled]);

  return (
    <button
      className="px-2 py-0.5 rounded text-xs bg-blue-100 text-blue-700 hover:bg-blue-200 disabled:opacity-50 disabled:cursor-not-allowed"
      disabled={isRetrying || disabled}
      onClick={handleClick}
    >
      {isRetrying ? "Retrying..." : "Retry"}
    </button>
  );
}
