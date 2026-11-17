import { RouterProvider } from '@tanstack/react-router'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from './shared/lib/queryClient'
import { AuthProvider } from './shared/context/AuthContext'
import { UploadProgressProvider } from './shared/context/UploadProgressContext'
import { UploadProgressBanner } from './shared/components/ui/UploadProgressBanner'
import { ToastProvider } from './shared/components/Toast/ToastProvider'
import { router } from './router'

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <UploadProgressProvider>
          <ToastProvider>
            <RouterProvider router={router} />
            <UploadProgressBanner />
          </ToastProvider>
        </UploadProgressProvider>
      </AuthProvider>
    </QueryClientProvider>
  )
}
