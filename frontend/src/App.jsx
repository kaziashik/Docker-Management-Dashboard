import { Routes, Route, Link } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import Containers from './pages/Containers'
import CreateContainer from './pages/CreateContainer'
import Volumes from './pages/Volumes'
import Networks from './pages/Networks'
import AppRoutes from './routes/AppRoutes'

function App() {
  return (
    <div className="p-6">
      {/* Temporary links for testing. We replace this with a real layout in the next task */}
      <nav className="flex gap-4 mb-6 text-blue-600 underline">
        <Link to="/">Dashboard</Link>
        <Link to="/containers">Containers</Link>
        <Link to="/containers/create">Create Container</Link>
        <Link to="/volumes">Volumes</Link>
        <Link to="/networks">Networks</Link>
      </nav>

      <AppRoutes></AppRoutes>
    </div>
  )
}

export default App