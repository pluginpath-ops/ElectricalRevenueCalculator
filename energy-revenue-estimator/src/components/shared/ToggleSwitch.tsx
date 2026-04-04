interface Props {
  checked: boolean
  onChange: (v: boolean) => void
  label?: string
}

export function ToggleSwitch({ checked, onChange, label }: Props) {
  return (
    <label className="flex items-center gap-2 cursor-pointer">
      <button
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative w-10 h-[22px] rounded-full transition-colors focus:outline-none
          focus:ring-2 focus:ring-[#2563EB] focus:ring-offset-1
          ${checked ? 'bg-[#2563EB]' : 'bg-[#D1D5DB]'}`}
      >
        <span
          style={{ transform: checked ? 'translateX(21px)' : 'translateX(3px)' }}
          className="absolute top-[3px] left-0 w-4 h-4 bg-white rounded-full shadow transition-transform"
        />
      </button>
      {label && <span className="text-sm text-[#111827]">{label}</span>}
    </label>
  )
}
