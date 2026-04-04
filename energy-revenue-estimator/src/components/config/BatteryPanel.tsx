import { useProjectStore } from '../../stores/projectStore'
import { Card } from '../shared/Card'
import { SliderInput } from '../shared/SliderInput'
import { ToggleSwitch } from '../shared/ToggleSwitch'
import { Tooltip } from '../shared/Tooltip'
import type { BatteryStrategy } from '../../types/battery'

export function BatteryPanel() {
  const cfg = useProjectStore(s => s.batteryConfig)
  const set = useProjectStore(s => s.setBatteryConfig)

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-[#111827]">⚡ Battery Storage</span>
          <Tooltip content="Model a battery that charges during solar generation and discharges when output drops, or use price thresholds for arbitrage." />
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

          <div>
            <div className="text-sm text-[#4B5563] mb-2 flex items-center gap-1">
              Dispatch Strategy
              <Tooltip content="Market (Hour-Ahead): charge/discharge at optimal hours within a configurable price visibility window. Solar Follower: charge while solar generating, discharge when it drops. Strike Price: charge/discharge at fixed price thresholds." />
            </div>
            <div className="flex flex-wrap gap-2">
              {(['hour-ahead', 'solar-follower', 'strike-price'] as BatteryStrategy[]).map(s => (
                <button
                  key={s}
                  onClick={() => set({ strategy: s })}
                  className={`px-3 py-1.5 text-sm rounded-md border transition-colors ${
                    cfg.strategy === s
                      ? 'bg-[#EFF6FF] border-[#2563EB] text-[#2563EB] font-medium'
                      : 'border-[#D1D5DB] text-[#4B5563] hover:border-[#9CA3AF]'
                  }`}
                >
                  {s === 'hour-ahead' ? 'Market (Hour-Ahead)' : s === 'solar-follower' ? 'Solar Follower' : 'Strike Price'}
                </button>
              ))}
            </div>
          </div>

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
                tooltip="How many hours ahead the operator can see prices. 1 = fully real-time, 4 = typical hour-ahead market, 12 = day-ahead segment."
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
