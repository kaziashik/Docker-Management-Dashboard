import { useCallback, useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { getErrorMessage } from '../services/api'
import { getVolumes, createVolume, removeVolume } from '../services/volumeService'
import ConfirmDialog from '../components/ConfirmDialog'

// Same rule as your backend: 2+ chars, letters/digits/_ . -, starts with letter or digit
const NAME_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9_.-]+$/

function Volumes() {
  const [volumes, setVolumes] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  const [name, setName] = useState('')
  const [creating, setCreating] = useState(false)

  const [volumeToDelete, setVolumeToDelete] = useState(null) // name of the volume waiting for confirmation
  const [deleting, setDeleting] = useState(false)

  const loadVolumes = useCallback(async () => {
    try {
      const data = await getVolumes()
      setVolumes(data)
      setLoadError('')
    } catch (err) {
      setLoadError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadVolumes()
  }, [loadVolumes])

  const handleCreate = async (e) => {
    e.preventDefault()
    const trimmed = name.trim()

    if (!NAME_PATTERN.test(trimmed)) {
      toast.error('Name must be 2+ characters: letters, digits, _ . - and start with a letter or digit.')
      return
    }

    setCreating(true)
    try {
      await createVolume(trimmed)
      toast.success(`Volume "${trimmed}" created successfully`)
      setName('')
      await loadVolumes()
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setCreating(false)
    }
  }

  // Runs only after the user clicks "Yes, delete" in the dialog
  const handleConfirmDelete = async () => {
    const volumeName = volumeToDelete
    setDeleting(true)
    try {
      await removeVolume(volumeName)
      toast.success(`Volume "${volumeName}" deleted successfully`)
      await loadVolumes()
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setDeleting(false)
      setVolumeToDelete(null) // close the dialog
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Volumes</h1>

      {/* Create form */}
      <form onSubmit={handleCreate} className="flex flex-wrap gap-3 mb-6">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="New volume name (e.g. my-volume)"
          className="flex-1 min-w-64 border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="submit"
          disabled={creating || !name.trim()}
          className="bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {creating ? 'Creating...' : 'Create volume'}
        </button>
      </form>

      {/* Load error (backend not running, etc.) */}
      {loadError && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {loadError}
        </div>
      )}

      {/* Table */}
      {loading ? (
        <p className="text-slate-500">Loading volumes...</p>
      ) : volumes.length === 0 ? (
        <p className="text-slate-500">No volumes yet. Create one above.</p>
      ) : (
        <div className="overflow-x-auto border border-slate-200 rounded-lg">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-4 py-3 font-semibold">Name</th>
                <th className="px-4 py-3 font-semibold">Driver</th>
                <th className="px-4 py-3 font-semibold">Mountpoint</th>
                <th className="px-4 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {volumes.map((v) => (
                <tr key={v.name} className="border-t border-slate-200 hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium">{v.name}</td>
                  <td className="px-4 py-3">{v.driver ?? '-'}</td>
                  <td className="px-4 py-3 text-slate-500 max-w-xs truncate" title={v.mountpoint}>
                    {v.mountpoint ?? '-'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => setVolumeToDelete(v.name)}
                      className="text-red-600 border border-red-200 rounded-md px-3 py-1 hover:bg-red-50"
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

      {/* Confirm dialog */}
      <ConfirmDialog
        open={volumeToDelete !== null}
        title="Delete volume?"
        message={`Are you sure you want to delete the volume "${volumeToDelete}"? This cannot be undone.`}
        loading={deleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setVolumeToDelete(null)}
      />
    </div>
  )
}

export default Volumes