import { useProjectStore } from '../../stores/projectStore'
import { Card } from '../shared/Card'
import { SliderInput } from '../shared/SliderInput'
import { ToggleSwitch } from '../shared/ToggleSwitch'
import { Tooltip } from '../shared/Tooltip'
import type { BatteryStrategy } from '../../types/battery'

function fmtHour(h: number): string {
  if (h === 0) return '12 AM'
  if (h < 12) return `${h} AM`
  if (h === 12) return '12 PM'
  return `${h - 12} PM`
}

const STRATEGIES: { id: BatteryStrategy; label: string }[] = [
  { id: 'peak-shaving',  label: 'Peak Shaving' },
  { id: 'hour-ahead',   label: 'Market (Hour-Ahead)' },
  { id: 'solar-follower', label: 'Solar Follower' },
  { id: 'strike-price', label: 'Strike Price' },
]

export function BatteryPanel() {
  const cfg = useProjectStore(s => s.batteryConfig)
  const set = useProjectStore(s => s.setBatteryConfig)

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-[#111827]">⚡ Battery Storage</span>
          <Tooltip content="Model a battery that charges and discharges to earn arbitrage revenue or guarantee a minimum output level." />
        </div>
        <ToggleSwitch checked={cfg.enabled} onChange={v => set({ enabled: v })} />
      </div>

      {cfg.enabled && (
        <div className="space-y-5 pt-1">
          <SliderInput
            label="Capacity"
            value={cfg.capacityMWh}
            min={0.5}
            max={100}
            step={0.5}
            onChange={v => set({ capacityMWh: v })}
            format={v => `${v} MWh`}
            tooltip="Total energy storage capacity in megawatt-hours"
          />

          <SliderInput
            label="Charge Rate"
            value={cfg.chargeRateMW}
            min={0.1}
            max={cfg.capacityMWh}
            step={0.1}
            onChange={v => set({ chargeRateMW: v })}
            format={v => `${v.toFixed(1)} MW`}
            tooltip="Maximum charge power (MW) — limits how fast the battery can fill"
          />

          <SliderInput
            label="Discharge Rate"
            value={cfg.dischargeRateMW}
            min={0.1}
            max={cfg.capacityMWh}
            step={0.1}
            onChange={v => set({ dischargeRateMW: v })}
            format={v => `${v.toFixed(1)} MW`}
            tooltip="Maximum discharge power (MW) — limits how fast the battery can empty"
          />

          <SliderInput
            label="Round-trip Efficiency"
            value={cfg.efficiency * 100}
            min={60}
            max={100}
            step={1}
            onChange={v => set({ efficiency: v / 100 })}
            format={v => `${v.toFixed(0)}%`}
            tooltip="Energy delivered on discharge / energy consumed on charge. Typical Li-ion: 85–92%."
          />

          {/* Strategy selector */}
          <div>
            <div className="text-sm text-[#4B5563] mb-2 flex items-center gap-1">
              Dispatch Strategy
              <Tooltip content="Peak Shaving: guarantee minimum output during a daily window. Market: trade on hour-ahead prices. Solar Follower: mirror solar output. Strike Price: fixed buy/sell thresholds." />
            </div>
            <div className="flex flex-wrap gap-2">
              {STRATEGIES.map(({ id, label }) => (
                <button
                  key={id}
                  onClick={() => set({ strategy: id })}
                  className={`px-3 py-1.5 text-sm rounded-md border transition-colors ${
                    cfg.strategy === id
                      ? 'bg-[#EFF6FF] border-[#2563EB] text-[#2563EB] font-medium'
                      : 'border-[#D1D5DB] text-[#4B5563] hover:border-[#9CA3AF]'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* ── Peak Shaving ─────────────────────────────────────────── */}
          {cfg.strategy === 'peak-shaving' && (
            <div className="space-y-4 pt-1 pl-3 border-l-2 border-[#E5E7EB]">
              <p className="text-xs text-[#6B7280]">
                Discharges to keep combined output (solar&nbsp;+&nbsp;battery) at or above the
                demand threshold during the TOU window. Recharges at the cheapest look-ahead
                hours outside the window.
              </p>
              <SliderInput
                label="Demand Threshold"
                value={cfg.demandThresholdKw}
                min={0}
                max={2000}
                step={50}
                onChange={v => set({ demandThresholdKw: v })}
                format={v => `${v} kW`}
                tooltip="Minimum combined output (solar + battery discharge) required during the TOU window."
              />
              <SliderInput
                label="TOU Start"
                value={cfg.touStartHour}
                min={0}
                max={23}
                step={1}
                onChange={v => set({ touStartHour: Math.min(v, cfg.touEndHour - 1) })}
                format={fmtHour}
                tooltip="Start of the time-of-use window (inclusive)."
              />
              <SliderInput
                label="TOU End"
                value={cfg.touEndHour}
                min={1}
                max={24}
                step={1}
                onChange={v => set({ touEndHour: Math.max(v, cfg.touStartHour + 1) })}
                format={v => fmtHour(v === 24 ? 0 : v)}
                tooltip="End of the time-of-use window (exclusive). E.g. 21 = window closes at 9 PM."
              />
              <SliderInput
                label="Charge Look-Ahead"
                value={cfg.lookAheadHours}
                min={1}
                max={12}
                step={1}
                onChange={v => set({ lookAheadHours: v })}
                format={v => `${v} hr${v !== 1 ? 's' : ''}`}
                tooltip="Hours of price visibility used when selecting the cheapest charging hour outside the TOU window."
              />
              <SliderInput
                label="Charge Strike Price"
                value={cfg.peakShavingBuyBelow}
                min={0}
                max={100}
                step={1}
                onChange={v => set({ peakShavingBuyBelow: v })}
                format={v => v === 0 ? 'Off' : `$${v}/MWh`}
                tooltip="Always charge outside the TOU window when price is at or below this level. Useful for encouraging overnight charging at cheap off-peak rates. 0 = disabled (look-ahead only)."
              />
              <div className="pt-1">
                <ToggleSwitch
                  checked={cfg.gridCharging}
                  onChange={v => set({ gridCharging: v })}
                  label="Allow grid charging"
                />
                <p className="text-xs text-[#9CA3AF] mt-1 ml-12">
                  When enabled, the battery can charge from the grid even without generation.
                </p>
              </div>

              {/* Demand reduction revenue */}
              <div className="pt-2 border-t border-[#E5E7EB]">
                <div className="text-xs font-semibold text-[#374151] mb-2 uppercase tracking-wide">
                  Demand Reduction Revenue
                </div>
                <p className="text-xs text-[#6B7280] mb-3">
                  Capacity payment earned for each clean day or month where output met the
                  demand threshold. Set to $0 to disable.
                </p>
                <SliderInput
                  label="Rate"
                  value={cfg.demandReductionRate}
                  min={0}
                  max={500}
                  step={1}
                  onChange={v => set({ demandReductionRate: v })}
                  format={v => v === 0 ? 'Off' : `$${v}/kW`}
                  tooltip="Revenue per kW of guaranteed capacity for each qualifying period. E.g. $100/kW earns demandThreshold × $100 for each clean month."
                />
                {cfg.demandReductionRate > 0 && (
                  <div className="mt-3">
                    <div className="text-xs text-[#4B5563] mb-1.5">Billing Period</div>
                    <div className="flex gap-2">
                      {(['day', 'month'] as const).map(p => (
                        <button
                          key={p}
                          onClick={() => set({ demandReductionPeriod: p })}
                          className={`px-3 py-1 text-sm rounded-md border transition-colors ${
                            cfg.demandReductionPeriod === p
                              ? 'bg-[#F0FDF4] border-[#16A34A] text-[#16A34A] font-medium'
                              : 'border-[#D1D5DB] text-[#4B5563] hover:border-[#9CA3AF]'
                          }`}
                        >
                          Per {p.charAt(0).toUpperCase() + p.slice(1)}
                        </button>
                      ))}
                    </div>
                    <p className="text-xs text-[#9CA3AF] mt-1.5">
                      {cfg.demandReductionPeriod === 'day'
                        ? 'Each clean day earns the rate independently.'
                        : 'A single violation forfeits the entire month\'s payment.'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Market (Hour-Ahead) ───────────────────────────────────── */}
          {cfg.strategy === 'hour-ahead' && (
            <div className="space-y-4 pt-1 pl-3 border-l-2 border-[#E5E7EB]">
              <p className="text-xs text-[#6B7280]">
                Simulates a market participant with hour-ahead price visibility — the same data
                published by ISOs like MISO and PJM. Charges at the cheapest hour in the window,
                discharges at the most expensive.
              </p>
              <SliderInput
                label="Look-Ahead Window"
                value={cfg.lookAheadHours}
                min={1}
                max={12}
                step={1}
                onChange={v => set({ lookAheadHours: v })}
                format={v => `${v} hr${v !== 1 ? 's' : ''}`}
                tooltip="How many hours ahead the operator can see prices. 1 = real-time, 4 = typical hour-ahead market, 12 = day-ahead segment."
              />
              <div className="pt-1">
                <ToggleSwitch
                  checked={cfg.gridCharging}
                  onChange={v => set({ gridCharging: v })}
                  label="Allow grid charging"
                />
                <p className="text-xs text-[#9CA3AF] mt-1 ml-12">
                  When enabled, the battery can charge from the grid even without generation.
                </p>
              </div>
            </div>
          )}

          {/* ── Solar Follower ────────────────────────────────────────── */}
          {cfg.strategy === 'solar-follower' && (
            <div className="space-y-4 pt-1 pl-3 border-l-2 border-[#E5E7EB]">
              <p className="text-xs text-[#6B7280]">
                Charges whenever generation exceeds the threshold below.
                Discharges once generation drops, optionally only when price is above a minimum.
              </p>
              <SliderInput
                label="Charge Threshold"
                value={cfg.solarChargeThresholdKwh}
                min={0}
                max={500}
                step={5}
                onChange={v => set({ solarChargeThresholdKwh: v })}
                format={v => `${v} kWh`}
                tooltip="Charge when generation exceeds this value. 0 = charge whenever any solar output is present."
              />
              <SliderInput
                label="Min Discharge Price"
                value={cfg.minDischargePrice}
                min={0}
                max={200}
                step={5}
                onChange={v => set({ minDischargePrice: v })}
                format={v => `$${v}/MWh`}
                tooltip="Only discharge when the price is at or above this threshold. 0 = always discharge when solar drops."
              />
            </div>
          )}

          {/* ── Strike Price ──────────────────────────────────────────── */}
          {cfg.strategy === 'strike-price' && (
            <div className="space-y-4 pt-1 pl-3 border-l-2 border-[#E5E7EB]">
              <p className="text-xs text-[#6B7280]">
                Charges when price is below the buy threshold; discharges when above the sell threshold.
              </p>
              <SliderInput
                label="Buy Below"
                value={cfg.buyThreshold}
                min={-50}
                max={200}
                step={1}
                onChange={v => set({ buyThreshold: v })}
                format={v => `$${v}/MWh`}
                tooltip="Charge when price is below this threshold"
              />
              <SliderInput
                label="Sell Above"
                value={cfg.sellThreshold}
                min={0}
                max={500}
                step={5}
                onChange={v => set({ sellThreshold: v })}
                format={v => `$${v}/MWh`}
                tooltip="Discharge when price is above this threshold"
              />
              <div className="pt-1">
                <ToggleSwitch
                  checked={cfg.gridCharging}
                  onChange={v => set({ gridCharging: v })}
                  label="Allow grid charging"
                />
                <p className="text-xs text-[#9CA3AF] mt-1 ml-12">
                  When enabled, the battery can charge from the grid even without generation.
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </Card>
  )
}
