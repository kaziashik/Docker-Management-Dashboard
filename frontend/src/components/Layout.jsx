import { Outlet } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import Sidebar from './Sidebar'

function Layout() {
  return (
    <div className="flex min-h-screen bg-white text-slate-800">
      <Sidebar />
      <main className="flex-1 p-8">
        <Outlet />
      </main>
      <Toaster position="top-right" />
    </div>
  )
}

export default Layout