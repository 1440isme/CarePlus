export function getAuthInputClassName({ hasError = false, hasTrailingIcon = false } = {}) {
  return [
    'w-full pl-10 py-3 border rounded-xl text-sm transition-[border-color,box-shadow] focus:outline-none focus:ring-2',
    hasTrailingIcon ? 'pr-10' : 'pr-4',
    hasError
      ? 'border-red-500 focus:border-red-500 focus:ring-red-100'
      : 'border-gray-200 focus:border-cyan-500 focus:ring-cyan-500/20',
  ].join(' ');
}
