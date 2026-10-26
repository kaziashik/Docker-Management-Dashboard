import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { getErrorMessage } from '../services/api'
import {
  getContainers,
  startContainer,
  stopContainer,
  restartContainer,
  removeContainer,
} from '../services/containerService'
import ConfirmDialog from '../components/ConfirmDialog'
import StatusBadge from '../components/StatusBadge'

const ACTIONS = {
  start: { run: startContainer, done: 'started' },
  stop: { run: stopContainer, done: 'stopped' },
  restart: { run: restartContainer, done: 'restarted' },
}

// Ports can be a string ("8080:80") or an array of objects, so handle both
function formatPorts(ports) {
  if (!ports) return '-'
  if (typeof ports === 'string') return ports || '-'
  if (Array.isArray(ports)) {
    const list = ports
      .map((p) => {
        if (typeof p === 'string') return p
        const pub = p.PublicPort ?? p.publicPort
        const priv = p.PrivatePort ?? p.privatePort
        return pub && priv ? `${pub}:${priv}` : priv ? `${priv}` : null
      })
      .filter(Boolean)
    return list.length ? [...new Set(list)].join(', ') : '-'
  }
  return '-'
}

function Containers() {
  const [containers, setContainers] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  const [busy, setBusy] = useState(null) // { id, action } of the row that is working
  const [containerToRemove, setContainerToRemove] = useState(null)
  const [removing, setRemoving] = useState(false)

  const loadContainers = useCallback(async () => {
    try {
      const data = await getContainers()
      setContainers(data)
      setLoadError('')
    } catch (err) {
      setLoadError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadContainers()
  }, [loadContainers])

  // start / stop / restart
  const handleAction = async (container, action) => {
    setBusy({ id: container.id, action })
    try {
      await ACTIONS[action].run(container.id)
      toast.success(`Container "${container.name}" ${ACTIONS[action].done} successfully`)
      await loadContainers()
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setBusy(null)
    }
  }

  // remove (after the user confirms)
  const handleConfirmRemove = async () => {
    const container = containerToRemove
    setRemoving(true)
    try {
      await removeContainer(container.id)
      toast.success(`Container "${container.name}" removed successfully`)
      await loadContainers()
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setRemoving(false)
      setContainerToRemove(null)
    }
  }

  const btn =
    'rounded-md border px-2.5 py-1 text-xs font-medium disabled:opacity-40 disabled:cursor-not-allowed'

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Containers</h1>
        <Link
          to="/containers/create"
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          + Create container
        </Link>
      </div>

      {loadError && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {loadError}
        </div>
      )}

      {loading ? (
        <p className="text-slate-500">Loading containers...</p>
      ) : containers.length === 0 ? (
        <p className="text-slate-500">No containers yet.</p>
      ) : (
        <div className="overflow-x-auto border border-slate-200 rounded-lg">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-4 py-3 font-semibold">Name</th>
                <th className="px-4 py-3 font-semibold">ID</th>
                <th className="px-4 py-3 font-semibold">Image</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Port(s)</th>
                <th className="px-4 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {containers.map((c) => {
                const isRunning = c.state === 'running'
                const rowBusy = busy?.id === c.id

                return (
                  <tr key={c.id} className="border-t border-slate-200 hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium">{c.name}</td>
                    <td className="px-4 py-3 font-mono text-slate-500" title={c.id}>
                      {c.id?.slice(0, 12)}
                    </td>
                    <td className="px-4 py-3 max-w-48 truncate" title={c.image}>
                      {c.image}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge state={c.state} />
                      {c.status && <div className="mt-1 text-xs text-slate-500">{c.status}</div>}
                    </td>
                    <td className="px-4 py-3">{formatPorts(c.ports)}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleAction(c, 'start')}
                          disabled={rowBusy || isRunning}
                          className={`${btn} border-green-200 text-green-700 hover:bg-green-50`}
                        >
                          {rowBusy && busy.action === 'start' ? 'Starting...' : 'Start'}
                        </button>
                        <button
                          onClick={() => handleAction(c, 'stop')}
                          disabled={rowBusy || !isRunning}
                          className={`${btn} border-yellow-300 text-yellow-700 hover:bg-yellow-50`}
                        >
                          {rowBusy && busy.action === 'stop' ? 'Stopping...' : 'Stop'}
                        </button>
                        <button
                          onClick={() => handleAction(c, 'restart')}
                          disabled={rowBusy}
                          className={`${btn} border-blue-200 text-blue-700 hover:bg-blue-50`}
                        >
                          {rowBusy && busy.action === 'restart' ? 'Restarting...' : 'Restart'}
                        </button>
                        <button
                          onClick={() => setContainerToRemove(c)}
                          disabled={rowBusy}
                          className={`${btn} border-red-200 text-red-600 hover:bg-red-50`}
                        >
                          Remove
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmDialog
        open={containerToRemove !== null}
        title="Remove container?"
        message={`Are you sure you want to remove the container "${containerToRemove?.name}"? If it is running, it will be force-removed. This cannot be undone.`}
        confirmText="Yes, remove"
        loading={removing}
        onConfirm={handleConfirmRemove}
        onCancel={() => setContainerToRemove(null)}
      />
    </div>
  )
}

export default Containers