interface Props {
  value: number
  onChange: (offset: number) => void
  label: string
}

const TIMEZONES = [
  { label: 'UTC',             offset:  0 },
  { label: 'Eastern (ET)',    offset: -5 },
  { label: 'Central (CT)',    offset: -6 },
  { label: 'Mountain (MT)',   offset: -7 },
  { label: 'Pacific (PT)',    offset: -8 },
  { label: 'Alaska (AKT)',    offset: -9 },
]

export function TimezoneSelector({ value, onChange, label }: Props) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-[#4B5563] whitespace-nowrap">{label} timezone</span>
      <select
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="text-xs border border-[#D1D5DB] rounded-md px-2 py-1 bg-white
          text-[#111827] focus:outline-none focus:border-[#2563EB] focus:ring-1
          focus:ring-[#2563EB] cursor-pointer"
      >
        {TIMEZONES.map(tz => (
          <option key={tz.offset} value={tz.offset}>{tz.label}</option>
        ))}
      </select>
    </div>
  )
}
