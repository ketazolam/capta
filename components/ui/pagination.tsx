import Link from "next/link"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface Props {
  currentPage: number
  totalPages: number
  baseUrl: string
}

export default function Pagination({ currentPage, totalPages, baseUrl }: Props) {
  if (totalPages <= 1) return null

  // baseUrl is expected to end with "&" (e.g. "...ventas?status=all&range=all&")
  const prev = currentPage > 1 ? `${baseUrl}page=${currentPage - 1}` : null
  const next = currentPage < totalPages ? `${baseUrl}page=${currentPage + 1}` : null

  return (
    <div className="flex items-center justify-center gap-3 mt-6">
      {prev ? (
        <Link
          href={prev}
          className="flex items-center gap-1 px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-zinc-400 hover:text-white hover:border-zinc-700 transition-colors"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          Anterior
        </Link>
      ) : (
        <span className="flex items-center gap-1 px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-zinc-600 cursor-not-allowed">
          <ChevronLeft className="w-3.5 h-3.5" />
          Anterior
        </span>
      )}
      <span className="text-sm text-zinc-500">
        {currentPage} / {totalPages}
      </span>
      {next ? (
        <Link
          href={next}
          className="flex items-center gap-1 px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-zinc-400 hover:text-white hover:border-zinc-700 transition-colors"
        >
          Siguiente
          <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      ) : (
        <span className="flex items-center gap-1 px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-zinc-600 cursor-not-allowed">
          Siguiente
          <ChevronRight className="w-3.5 h-3.5" />
        </span>
      )}
    </div>
  )
}
