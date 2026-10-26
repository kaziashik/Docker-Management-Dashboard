import { useCallback, useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { getErrorMessage } from '../services/api'
import { getNetworks, createNetwork, removeNetwork } from '../services/networkService'
import ConfirmDialog from '../components/ConfirmDialog'

const DRIVERS = ['bridge', 'host', 'none'] // same list your backend allows
const NAME_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9_.-]+$/

function Networks() {
  const [networks, setNetworks] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  const [name, setName] = useState('')
  const [driver, setDriver] = useState('bridge')
  const [creating, setCreating] = useState(false)

  const [networkToDelete, setNetworkToDelete] = useState(null) // the whole network object
  const [deleting, setDeleting] = useState(false)

  const loadNetworks = useCallback(async () => {
    try {
      const data = await getNetworks()
      setNetworks(data)
      setLoadError('')
    } catch (err) {
      setLoadError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadNetworks()
  }, [loadNetworks])

  const handleCreate = async (e) => {
    e.preventDefault()
    const trimmed = name.trim()

    if (!NAME_PATTERN.test(trimmed)) {
      toast.error('Name must be 2+ characters: letters, digits, _ . - and start with a letter or digit.')
      return
    }

    setCreating(true)
    try {
      await createNetwork(trimmed, driver)
      toast.success(`Network "${trimmed}" created successfully`)
      setName('')
      setDriver('bridge')
      await loadNetworks()
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setCreating(false)
    }
  }

  const handleConfirmDelete = async () => {
    const network = networkToDelete
    setDeleting(true)
    try {
      await removeNetwork(network.id)
      toast.success(`Network "${network.name}" deleted successfully`)
      await loadNetworks()
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setDeleting(false)
      setNetworkToDelete(null)
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Networks</h1>

      {/* Create form */}
      <form onSubmit={handleCreate} className="flex flex-wrap gap-3 mb-6">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="New network name (e.g. my-network)"
          className="flex-1 min-w-64 border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select
          value={driver}
          onChange={(e) => setDriver(e.target.value)}
          className="border border-slate-300 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {DRIVERS.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
        <button
          type="submit"
          disabled={creating || !name.trim()}
          className="bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {creating ? 'Creating...' : 'Create network'}
        </button>
      </form>

      {loadError && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {loadError}
        </div>
      )}

      {/* Table */}
      {loading ? (
        <p className="text-slate-500">Loading networks...</p>
      ) : networks.length === 0 ? (
        <p className="text-slate-500">No networks found.</p>
      ) : (
        <div className="overflow-x-auto border border-slate-200 rounded-lg">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-4 py-3 font-semibold">Name</th>
                <th className="px-4 py-3 font-semibold">ID</th>
                <th className="px-4 py-3 font-semibold">Driver</th>
                <th className="px-4 py-3 font-semibold">Scope</th>
                <th className="px-4 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {networks.map((n) => (
                <tr key={n.id} className="border-t border-slate-200 hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium">
                    {n.name}
                    {n.builtIn && (
                      <span className="ml-2 rounded border border-slate-300 px-1.5 py-0.5 text-xs font-normal text-slate-500">
                        built-in
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 font-mono text-slate-500" title={n.id}>
                    {n.id?.slice(0, 12)}
                  </td>
                  <td className="px-4 py-3">{n.driver ?? '-'}</td>
                  <td className="px-4 py-3">{n.scope ?? '-'}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => setNetworkToDelete(n)}
                      disabled={n.builtIn}
                      title={n.builtIn ? 'Built-in networks cannot be deleted' : 'Delete network'}
                      className="text-red-600 border border-red-200 rounded-md px-3 py-1 hover:bg-red-50 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmDialog
        open={networkToDelete !== null}
        title="Delete network?"
        message={`Are you sure you want to delete the network "${networkToDelete?.name}"? This cannot be undone.`}
        loading={deleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setNetworkToDelete(null)}
      />
    </div>
  )
}

export default Networks