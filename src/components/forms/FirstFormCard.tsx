import { ArrowRight, Plus } from 'lucide-react'
import { Link } from 'react-router-dom'

/**
 * What a new account sees where its forms would be (Home, My forms): no example form,
 * so the first step is a form of their own or the /demo.
 */
export function FirstFormCard({ onCreateForm }: { onCreateForm: () => void }) {
  return (
    <div className="flex flex-col items-start gap-4 rounded-[15px] border border-dashed border-[#d2d8e5] bg-white px-8 py-9 max-[560px]:px-5 max-[560px]:py-7">
      <div className="flex flex-col gap-2">
        <p className="m-0 text-[20px] font-semibold text-[#14181f]">Create your first form</p>
        <p className="m-0 max-w-130 text-[14px] leading-6 text-[#3f4045]">
          Ask open questions, share the link, and OpenGNP sorts every answer into topics. Not sure where to start? Try
          the sample form first: edit it and explore its dashboard.
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <button
          className="inline-flex h-9.5 cursor-pointer items-center gap-1.5 rounded-[10px] bg-[#1e55c5] px-4 text-[14px] font-semibold text-white transition-colors hover:bg-[#1a49aa] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1e55c5]"
          onClick={onCreateForm}
          type="button"
        >
          <Plus size={16} />
          Create form
        </button>
        <Link
          className="inline-flex h-9.5 items-center gap-1.5 rounded-[10px] border border-[#d2d8e5] bg-white px-4 text-[14px] font-semibold text-[#3f4045] transition-colors hover:bg-[#f7f8fb] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1e55c5]"
          to="/demo"
        >
          See the demo
          <ArrowRight size={16} />
        </Link>
      </div>
    </div>
  )
}
