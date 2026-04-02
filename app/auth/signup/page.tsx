"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"

export default function SignupPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback` },
    })
    if (error) {
      toast.error(error.message)
      setLoading(false)
      return
    }
    toast.success("¡Revisá tu email para confirmar la cuenta!")
    router.push("/auth/login")
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
      <div className="w-full max-w-md space-y-8 px-4">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 mb-6">
            <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center">
              <span className="text-black font-bold text-sm">C</span>
            </div>
            <span className="text-xl font-bold">Capta</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Crear cuenta gratis</h1>
          <p className="text-zinc-400 mt-2 text-sm">Empezá a convertir tus anuncios hoy</p>
        </div>

        <form onSubmit={handleSignup} className="space-y-4 bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-zinc-300">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="tu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-emerald-500"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password" className="text-zinc-300">Contraseña</Label>
            <Input
              id="password"
              type="password"
              placeholder="Mínimo 8 caracteres"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-emerald-500"
            />
          </div>
          <Button type="submit" disabled={loading} className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-semibold">
            {loading ? "Creando cuenta..." : "Crear cuenta gratis"}
          </Button>
          <p className="text-center text-sm text-zinc-500">
            ¿Ya tenés cuenta?{" "}
            <Link href="/auth/login" className="text-emerald-400 hover:text-emerald-300">
              Ingresar
            </Link>
          </p>
        </form>
      </div>
    </div>
  )
}
