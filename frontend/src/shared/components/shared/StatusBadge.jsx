import { statusLabels, statusColors } from '../../data/mockData';

export function StatusBadge({ status, size = 'md' }) {
  return (
    <span className={`inline-flex items-center rounded-full font-medium ${statusColors[status]} ${
      size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs'
    }`}>
      <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
        status === 'CONFIRMED' ? 'bg-blue-500' :
        status === 'CHECKED_IN' ? 'bg-purple-500' :
        status === 'COMPLETED' ? 'bg-green-500' :
        status === 'CANCELLED' ? 'bg-gray-400' :
        status === 'NO_SHOW' ? 'bg-red-500' :
        'bg-amber-500'
      }`} />
      {statusLabels[status]}
    </span>
  );
}
