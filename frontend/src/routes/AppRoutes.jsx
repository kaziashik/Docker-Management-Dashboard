import { Routes, Route } from 'react-router-dom'
import Dashboard from '../pages/Dashboard'
import Containers from '../pages/Containers'
import CreateContainer from '../pages/CreateContainer'
import Volumes from '../pages/Volumes'
import Networks from '../pages/Networks'

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/containers" element={<Containers />} />
      <Route path="/containers/create" element={<CreateContainer />} />
      <Route path="/volumes" element={<Volumes />} />
      <Route path="/networks" element={<Networks />} />
      <Route path="*" element={<h1 className="text-2xl font-bold">404 - Page not found</h1>} />
    </Routes>
  )
}

export default AppRoutes