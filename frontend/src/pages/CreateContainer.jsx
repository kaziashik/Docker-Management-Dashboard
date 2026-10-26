import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { getErrorMessage } from '../services/api'
import { createContainer } from '../services/containerService'

const NAME_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9_.-]+$/
const PORT_PATTERN = /^\d{1,5}(:\d{1,5})?$/ // "80" or "8080:80"

function isValidPort(value) {
  if (!PORT_PATTERN.test(value)) return false
  return value.split(':').every((p) => Number(p) >= 1 && Number(p) <= 65535)
}

function CreateContainer() {
  const navigate = useNavigate()

  const [form, setForm] = useState({ image: '', name: '', port: '' })
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
    setErrors((prev) => ({ ...prev, [name]: '' })) // clear the error while typing
  }

  const validate = () => {
    const found = {}
    const image = form.image.trim()
    const name = form.name.trim()
    const port = form.port.trim()

    if (!image) found.image = 'Image is required (for example: nginx)'
    else if (/\s/.test(image)) found.image = 'Image name cannot contain spaces'

    if (name && !NAME_PATTERN.test(name)) {
      found.name = 'Use 2+ characters: letters, digits, _ . - and start with a letter or digit'
    }

    if (port && !isValidPort(port)) {
      found.port = 'Use a format like 8080:80 (or just 80). Ports must be 1-65535'
    }

    setErrors(found)
    return Object.keys(found).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return

    setSubmitting(true)
    try {
      await createContainer({
        image: form.image.trim(),
        name: form.name.trim(),
        port: form.port.trim(),
      })
      toast.success(`Container created and started from "${form.image.trim()}"`)
      navigate('/containers') // redirect on success
    } catch (err) {
      toast.error(getErrorMessage(err))
      setSubmitting(false) // stay on the page so the user can fix the form
    }
  }

  const inputClass = (field) =>
    `w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 disabled:bg-slate-100 ${
      errors[field]
        ? 'border-red-400 focus:ring-red-400'
        : 'border-slate-300 focus:ring-blue-500'
    }`

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-bold mb-2">Create Container</h1>
      <p className="mb-6 text-sm text-slate-500">
        Creates and starts a new container. If the image is not on your machine, it will be pulled first.
      </p>

      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        {/* Image */}
        <div>
          <label htmlFor="image" className="mb-1 block text-sm font-medium">
            Image <span className="text-red-500">*</span>
          </label>
          <input
            id="image"
            name="image"
            type="text"
            value={form.image}
            onChange={handleChange}
            placeholder="nginx  or  nginx:alpine"
            disabled={submitting}
            className={inputClass('image')}
          />
          {errors.image && <p className="mt-1 text-xs text-red-600">{errors.image}</p>}
        </div>

        {/* Name */}
        <div>
          <label htmlFor="name" className="mb-1 block text-sm font-medium">
            Container name <span className="text-slate-400 font-normal">(optional)</span>
          </label>
          <input
            id="name"
            name="name"
            type="text"
            value={form.name}
            onChange={handleChange}
            placeholder="my-nginx"
            disabled={submitting}
            className={inputClass('name')}
          />
          {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name}</p>}
        </div>

        {/* Port */}
        <div>
          <label htmlFor="port" className="mb-1 block text-sm font-medium">
            Port mapping <span className="text-slate-400 font-normal">(optional)</span>
          </label>
          <input
            id="port"
            name="port"
            type="text"
            value={form.port}
            onChange={handleChange}
            placeholder="8080:80"
            disabled={submitting}
            className={inputClass('port')}
          />
          <p className="mt-1 text-xs text-slate-500">
            Format is <code>host:container</code>. For example <code>8080:80</code> opens
            http://localhost:8080 for a container listening on port 80.
          </p>
          {errors.port && <p className="mt-1 text-xs text-red-600">{errors.port}</p>}
        </div>

        {submitting && (
          <p className="text-sm text-blue-600">
            Creating container... If the image has to be downloaded, this can take a while.
          </p>
        )}

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={submitting}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? 'Creating...' : 'Create & run'}
          </button>
          <Link
            to="/containers"
            className={`rounded-md border border-slate-300 px-4 py-2 text-sm hover:bg-slate-50 ${
              submitting ? 'pointer-events-none opacity-50' : ''
            }`}
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  )
}

export default CreateContainer