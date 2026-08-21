import { Image, Trash2, Upload } from 'lucide-react'
import { useRef } from 'react'

export type CoverImageFieldProps = {
  imageUrl: string | null
  onSelectImage: (file: File) => void
  onRemoveImage: () => void
}

export function CoverImageField({
  imageUrl,
  onSelectImage,
  onRemoveImage,
}: CoverImageFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  const openPicker = () => {
    inputRef.current?.click()
  }

  return (
    <>
      {imageUrl ? (
        <div className="relative -mt-15.25 -mr-17.5 -ml-20 h-[180px] w-auto shrink-0 max-[760px]:-mx-6 max-[760px]:-mt-9">
          <img
            alt="Form cover"
            className="size-full object-cover"
            src={imageUrl}
          />
          <div className="absolute top-6 right-6 flex items-center gap-2.5">
            <button
              className="inline-flex h-9.75 cursor-pointer items-center gap-2.5 rounded-[5px] bg-white px-4 text-[14px] tracking-[0.14px] text-[#616161] shadow-[0_2px_8px_rgba(15,23,42,0.18)] transition-colors hover:bg-[#f7f8fb] focus-visible:ring-2 focus-visible:ring-[#1e55c5]/40 focus-visible:outline-none"
              onClick={openPicker}
              type="button"
            >
              <Upload size={17} />
              <span>Upload new cover</span>
            </button>
            <button
              className="inline-flex h-9.75 cursor-pointer items-center gap-2.5 rounded-[5px] bg-white px-4 text-[14px] tracking-[0.14px] text-[#616161] shadow-[0_2px_8px_rgba(15,23,42,0.18)] transition-colors hover:bg-[#f7f8fb] focus-visible:ring-2 focus-visible:ring-[#1e55c5]/40 focus-visible:outline-none"
              onClick={onRemoveImage}
              type="button"
            >
              <Trash2 size={17} />
              <span>Remove cover</span>
            </button>
          </div>
        </div>
      ) : (
        <button
          className="inline-flex w-fit cursor-pointer items-center gap-1.5 rounded-md border-0 bg-transparent px-0 text-[14px] font-normal tracking-[0.14px] text-[#b0b1b3] transition-colors hover:text-[#7b7d86] focus-visible:ring-2 focus-visible:ring-[#1e55c5]/30 focus-visible:outline-none"
          onClick={openPicker}
          type="button"
        >
          <Image size={18} strokeWidth={2.1} />
          <span>Add cover</span>
        </button>
      )}

      <input
        ref={inputRef}
        accept="image/*"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0]
          if (file) {
            onSelectImage(file)
          }
          event.target.value = ''
        }}
        type="file"
      />
    </>
  )
}
