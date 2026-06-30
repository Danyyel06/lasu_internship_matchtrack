import { Navigate, Outlet } from 'react-router-dom';

interface ProtectedRouteProps {
  allowedRoles?: string[];
}

export function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const token = localStorage.getItem('access_token');
  
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // If roles are specified, decode token and check role
  if (allowedRoles && allowedRoles.length > 0) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const userRole = payload.role;
      if (!allowedRoles.includes(userRole)) {
        return <Navigate to="/unauthorized" replace />;
      }
    } catch {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      return <Navigate to="/login" replace />;
    }
  }

  return <Outlet />;
}
