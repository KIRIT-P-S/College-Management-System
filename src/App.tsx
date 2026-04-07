import { AuthProvider, useAuth } from './context/AuthContext'
import Login from './dashboards/Login'
import StudentDashboard from './dashboards/StudentDashboard'
import ProfessorDashboard from './dashboards/ProfessorDashboard'
import HODDashboard from './dashboards/HODDashboard'
import ManagementDashboard from './dashboards/ManagementDashboard'
import './portal.css'

function Portal() {
  const { user, role } = useAuth()

  if (!user) return <Login />
  if (role === 'student') return <StudentDashboard />
  if (role === 'professor') return <ProfessorDashboard />
  if (role === 'hod') return <HODDashboard />
  if (role === 'management') return <ManagementDashboard />
  return null
}

function App() {
  return (
    <AuthProvider>
      <Portal />
    </AuthProvider>
  )
}

export default App
