import { redirect } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { LoginForm } from '@/components/backoffice/login-form'
import { configHint, isAdmin, isConfigured } from '@/lib/backoffice-auth'

export default async function LoginPage() {
  if (await isAdmin()) redirect('/backoffice')

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <Image
            src="/images/logoautogestiva.png"
            alt="Autogestiva"
            width={500}
            height={197}
            priority
            className="mx-auto h-24 w-auto"
            // El logo es blanco (para el encabezado azul): se tiñe del azul de la marca.
            style={{ filter: 'brightness(0) saturate(100%) invert(24%) sepia(35%) saturate(1768%) hue-rotate(176deg) brightness(89%) contrast(93%)' }}
          />
          <p className="mt-3 text-sm text-gray-500">Iniciá sesión para administrar tu tienda</p>
        </div>
        <LoginForm configured={isConfigured()} hint={configHint()} />
        <Link href="/" className="mt-6 flex items-center justify-center gap-2 text-sm font-medium text-primary hover:underline">
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Volver a la app
        </Link>
      </div>
    </div>
  )
}
