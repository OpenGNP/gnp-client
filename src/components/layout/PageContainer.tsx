import type { ReactNode } from 'react'

export function PageContainer({ children }: { children?: ReactNode }) {
  return (
    <div className="mx-auto w-[min(1038px,calc(100%_-_64px))] pb-[72px] max-[1200px]:w-[min(820px,calc(100%_-_48px))] max-[560px]:w-[calc(100%_-_32px)]">
      {children}
    </div>
  )
}
