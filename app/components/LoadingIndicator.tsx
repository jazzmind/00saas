'use client';

interface LoadingIndicatorProps {
  onCancel?: () => void;
}

export default function LoadingIndicator({ onCancel }: LoadingIndicatorProps) {
  return (
    <div className="flex items-center justify-between bg-gray-100 dark:bg-gray-800 rounded-lg p-4">
      <div className="flex items-center space-x-3">
        <div className="animate-pulse flex space-x-2">
          <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
          <div className="h-2 w-2 bg-blue-500 rounded-full animation-delay-200"></div>
          <div className="h-2 w-2 bg-blue-500 rounded-full animation-delay-400"></div>
        </div>
        <span className="text-gray-600 dark:text-gray-300">AI is thinking...</span>
      </div>
      {onCancel && (
        <button
          onClick={onCancel}
          className="text-sm px-2 py-1 rounded bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
        >
          Cancel
        </button>
      )}
    </div>
  );
} 