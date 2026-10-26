const STYLES = {
  running: 'bg-green-100 text-green-700',
  exited: 'bg-red-100 text-red-700',
  paused: 'bg-yellow-100 text-yellow-700',
  restarting: 'bg-yellow-100 text-yellow-700',
  created: 'bg-blue-100 text-blue-700',
  dead: 'bg-red-100 text-red-700',
}

function StatusBadge({ state }) {
  const key = (state || '').toLowerCase()
  const style = STYLES[key] || 'bg-slate-100 text-slate-600'

  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${style}`}>
      {state || 'unknown'}
    </span>
  )
}

export default StatusBadge