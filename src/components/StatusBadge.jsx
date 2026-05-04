const styles = {
  created:   'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-purple-100 text-purple-800',
  pending:   'bg-yellow-100 text-yellow-800',
  preparing: 'bg-blue-100 text-blue-800',
  served:    'bg-green-100 text-green-800',
  completed: 'bg-gray-200 text-gray-800',
  free:      'bg-green-100 text-green-800',
  available: 'bg-green-100 text-green-800',
  occupied:  'bg-red-100 text-red-800',
  cleaning:  'bg-orange-100 text-orange-800',
}

export default function StatusBadge({ status }) {
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${styles[status] || 'bg-gray-100 text-gray-700'}`}>
      {status}
    </span>
  )
}
