import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AdminDashboardPage } from '../../features/admin/AdminDashboardPage'
import { DocumentsPage } from '../../features/admin/DocumentsPage'
import { AffiliatesPage } from '../../features/affiliates/AffiliatesPage'
import { LoginPage } from '../auth/LoginPage'
import { SolicitudesPage } from '../../features/solicitudes/SolicitudesPage'
import { MyBookingsPage } from '../../features/bookings/MyBookingsPage'
import { RequestServicePage } from '../../features/bookings/RequestServicePage'
import { TourismPage } from '../../features/bookings/TourismPage'
import { AdminDriversPage } from '../../features/drivers/AdminDriversPage'
import { DriverPortalPage } from '../../features/drivers/DriverPortalPage'
import { PaymentsPage } from '../../features/payments/PaymentsPage'
import { AdminRentalsPage } from '../../features/rentals/AdminRentalsPage'
import { GpsPage } from '../../features/tracking/GpsPage'
import { VehiclesPage } from '../../features/vehicles/VehiclesPage'
import { PagePlaceholder } from '../../components/ui/PagePlaceholder'
import { AppLayout } from './AppLayout'

const routes = [
  { index: true, element: <Navigate to="/turismo" replace /> },
  { path: 'login', element: <LoginPage /> },
  { path: 'turismo', element: <TourismPage /> },
  { path: 'solicitar', element: <RequestServicePage /> },
  { path: 'conductor', element: <DriverPortalPage /> },
  { path: 'mis-reservas', element: <MyBookingsPage /> },
  { path: 'admin/gps', element: <GpsPage /> },
  { path: '*', element: <PagePlaceholder title="Página no encontrada" description="La ruta solicitada no existe en Kaluz Digital." /> },
]

export const router = createBrowserRouter([
  { path: '/admin/dashboard', element: <AdminDashboardPage /> },
  { path: '/admin/alquileres', element: <AdminRentalsPage /> },
  { path: '/admin/pagos', element: <PaymentsPage /> },
  { path: '/admin/documentos', element: <DocumentsPage /> },
  { path: '/admin/vehiculos', element: <VehiclesPage /> },
  { path: '/admin/conductores', element: <AdminDriversPage /> },
  { path: '/admin/afiliados', element: <AffiliatesPage /> },
  { path: '/admin/solicitudes', element: <SolicitudesPage /> },
  { path: '/', element: <AppLayout />, children: routes },
])
