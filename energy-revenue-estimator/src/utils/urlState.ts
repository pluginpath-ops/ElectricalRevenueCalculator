import type { BatteryConfig } from '../types/battery'

interface EncodedState {
  battery?: {
    enabled: boolean
    capacityMWh: number
    chargeRateMW: number
    dischargeRateMW: number
    efficiency: number
    strategy: BatteryConfig['strategy']
    buyThreshold: number
    sellThreshold: number
    gridCharging: boolean
  }
  scalingFactor?: number
}

export function encodeUrlState(
  batteryConfig: BatteryConfig,
  scalingFactor: number,
): void {
  const state: EncodedState = {
    battery: {
      enabled: batteryConfig.enabled,
      capacityMWh: batteryConfig.capacityMWh,
      chargeRateMW: batteryConfig.chargeRateMW,
      dischargeRateMW: batteryConfig.dischargeRateMW,
      efficiency: batteryConfig.efficiency,
      strategy: batteryConfig.strategy,
      buyThreshold: batteryConfig.buyThreshold,
      sellThreshold: batteryConfig.sellThreshold,
      gridCharging: batteryConfig.gridCharging,
    },
    scalingFactor,
  }
  const encoded = btoa(JSON.stringify(state))
  const url = new URL(window.location.href)
  url.searchParams.set('cfg', encoded)
  window.history.replaceState(null, '', url.toString())
}

export function decodeUrlState(): Partial<EncodedState> {
  try {
    const url = new URL(window.location.href)
    const cfg = url.searchParams.get('cfg')
    if (!cfg) return {}
    return JSON.parse(atob(cfg)) as EncodedState
  } catch {
    return {}
  }
}
