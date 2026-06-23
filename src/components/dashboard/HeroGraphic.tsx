import { Sparkles } from 'lucide-react'

export function HeroGraphic() {
  return (
    <div
      className="relative h-[262px] rounded-r-[112px] bg-gradient-to-r from-white/0 to-[#edf3ff] max-[1200px]:w-[min(562px,100%)] max-[560px]:hidden"
      aria-hidden="true"
    >
      <div className="absolute top-[68px] left-[70px] text-[#8fc9ff]">
        <Sparkles size={31} fill="currentColor" />
      </div>
      <div className="absolute top-[39px] left-[110px] text-[#8fc9ff]">
        <Sparkles size={23} fill="currentColor" />
      </div>
      <div className="absolute top-[97px] left-[113px] text-[#8fc9ff]">
        <Sparkles size={15} fill="currentColor" />
      </div>
      <div className="absolute top-[79px] left-[157px] flex h-[155px] w-[236px] flex-col justify-center rounded-[15px] bg-[#f8fbff] px-[18px] py-[17px] shadow-[0_4px_14.9px_rgba(108,136,220,0.24)]">
        <div className="mb-[13px] flex w-[61px] flex-col gap-1.5">
          <span className="h-[7px] w-[42px] rounded-[17px] bg-[#dee5f6]" />
          <span className="h-[7px] rounded-[17px] bg-[#dee5f6]" />
        </div>
        <div className="flex items-end justify-between">
          <div className="relative size-[78px] rounded-full bg-[conic-gradient(#8c6df1_0_24%,#28b8fc_24%_50%,#005cfe_50%_100%)] after:absolute after:inset-4 after:rounded-full after:bg-[#f8fbff] after:content-['']" />
          <div className="flex h-[72px] items-end gap-2.5">
            <span className="h-[72px] w-[13px] rounded-[5px] bg-[#d8edfd]" />
            <span className="h-[35px] w-[13px] rounded-[5px] bg-[#29b9fd]" />
            <span className="h-[58px] w-[13px] rounded-[5px] bg-[#005cfe]" />
            <span className="h-[39px] w-[13px] rounded-[5px] bg-[#e2e9fe]" />
          </div>
        </div>
      </div>
      <div className="absolute top-[100px] left-[379px] flex h-[57px] w-[153px] items-center gap-4 rounded-[10px] bg-white py-3 pr-3.5 pl-4 text-[#005cfe] shadow-[0_0_9px_rgba(121,154,255,0.3)]">
        <Sparkles size={27} fill="currentColor" />
        <div className="flex w-[82px] flex-col gap-1.5">
          <span className="h-[7px] rounded-[17px] bg-[#dee5f6]" />
          <span className="h-[7px] w-[47px] rounded-[17px] bg-[#dee5f6]" />
        </div>
      </div>
    </div>
  )
}
