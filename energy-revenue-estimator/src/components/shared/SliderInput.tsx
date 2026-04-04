interface Props {
  label: string
  value: number
  min: number
  max: number
  step: number
  onChange: (v: number) => void
  format?: (v: number) => string
  tooltip?: string
}

export function SliderInput({ label, value, min, max, step, onChange, format, tooltip }: Props) {
  const display = format ? format(value) : String(value)
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className="text-[#4B5563]">{label} {tooltip && <span title={tooltip}>ⓘ</span>}</span>
        <span className="font-medium text-[#111827]">{display}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
        className="w-full h-1 bg-[#F1F3F5] rounded appearance-none cursor-pointer
          [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-[18px]
          [&::-webkit-slider-thumb]:h-[18px] [&::-webkit-slider-thumb]:bg-white
          [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-[#2563EB]
          [&::-webkit-slider-thumb]:rounded-full"
      />
      <div className="flex justify-between text-xs text-[#9CA3AF]">
        <span>{format ? format(min) : min}</span>
        <span>{format ? format(max) : max}</span>
      </div>
    </div>
  )
}
