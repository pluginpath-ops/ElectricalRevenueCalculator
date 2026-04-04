import { useProjectStore } from '../../stores/projectStore'
import { Card } from '../shared/Card'
import { SliderInput } from '../shared/SliderInput'

export function GenerationScaler() {
  const scalingFactor = useProjectStore(s => s.scalingFactor)
  const setScalingFactor = useProjectStore(s => s.setScalingFactor)

  return (
    <Card>
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-[#111827]">Generation Scaling</h3>
        <p className="text-xs text-[#9CA3AF] mt-0.5">
          Scale generation output to model different system sizes.
        </p>
      </div>
      <SliderInput
        label="Scaling Factor"
        value={scalingFactor}
        min={0.25}
        max={4.0}
        step={0.05}
        onChange={setScalingFactor}
        format={v => `${v.toFixed(2)}×`}
        tooltip="Multiplies all generation values. 1.0 = as-imported. 2.0 = double the system size."
      />
    </Card>
  )
}
