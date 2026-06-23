import { Clock3, MoreVertical } from 'lucide-react'

export type FormCardProps = {
  title: string
  image: string
  updatedAt: string
  imageAlt?: string
}

export function FormCard({
  image,
  imageAlt = '',
  title,
  updatedAt,
}: FormCardProps) {
  return (
    <article className="h-[239px] w-full max-w-[235px] overflow-hidden rounded-lg bg-white shadow-[0_2px_7px_rgba(31,43,69,0.13)] max-[560px]:max-w-none">
      <img
        src={image}
        alt={imageAlt}
        className="block h-[167px] w-full object-cover"
      />
      <div className="px-[11px] pt-[15px] pb-2.5">
        <h3 className="m-0 mb-2.5 overflow-hidden text-ellipsis whitespace-nowrap text-[12px] leading-4 font-bold tracking-[0.12px] text-black">
          {title}
        </h3>
        <div className="flex items-center gap-[7px] text-[9px] leading-3 font-normal tracking-[0.09px] text-[#969696] [&_svg]:shrink-0">
          <Clock3 className="shrink-0" size={18} />
          <span>Last update</span>
          <strong className="font-bold text-[#828282]">{updatedAt}</strong>
          <button
            className="ml-auto inline-flex cursor-pointer items-center justify-center border-0 bg-transparent p-0 text-black"
            aria-label={`More options for ${title}`}
          >
            <MoreVertical size={18} />
          </button>
        </div>
      </div>
    </article>
  )
}
