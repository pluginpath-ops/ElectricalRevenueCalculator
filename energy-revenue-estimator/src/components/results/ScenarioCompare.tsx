import { useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import { useProjectStore } from '../../stores/projectStore'
import { fmtDollar, fmtPct } from '../../utils/formatters'

export function ScenarioCompare() {
  const scenarios = useProjectStore(s => s.scenarios)
  const results = useProjectStore(s => s.results)
  const saveScenario = useProjectStore(s => s.saveScenario)
  const deleteScenario = useProjectStore(s => s.deleteScenario)
  const [name, setName] = useState('')

  if (!results) return null

  const handleSave = () => {
    const n = name.trim() || `Scenario ${scenarios.length + 1}`
    saveScenario(n)
    setName('')
  }

  const chartData = scenarios.map(sc => ({
    name: sc.name,
    'Gen Revenue': sc.summary.annualGenerationRevenue,
    'Battery Revenue': sc.summary.annualBatteryRevenue,
  }))

  return (
    <div className="bg-white border border-[#D1D5DB] rounded-lg p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-[15px] font-semibold text-[#111827]">Scenario Compare</h3>
        <div className="flex gap-2">
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSave()}
            placeholder="Scenario name…"
            className="text-sm border border-[#D1D5DB] rounded-md px-3 py-1.5 w-40
              focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]"
          />
          <button
            onClick={handleSave}
            className="px-3 py-1.5 bg-[#2563EB] text-white text-sm rounded-md hover:bg-[#1D4ED8]"
          >
            Save current
          </button>
        </div>
      </div>

      {scenarios.length === 0 ? (
        <p className="text-sm text-[#4B5563]">
          Save the current configuration as a scenario to compare results side by side.
        </p>
      ) : (
        <>
          {/* Comparison table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#F1F3F5] border-y border-[#D1D5DB]">
                  <th className="text-left px-3 py-2 text-xs font-semibold uppercase tracking-wide text-[#4B5563]">
                    Scenario
                  </th>
                  <th className="text-right px-3 py-2 text-xs font-semibold uppercase tracking-wide text-[#4B5563]">
                    Annual Revenue
                  </th>
                  <th className="text-right px-3 py-2 text-xs font-semibold uppercase tracking-wide text-[#4B5563]">
                    Battery Rev.
                  </th>
                  <th className="text-right px-3 py-2 text-xs font-semibold uppercase tracking-wide text-[#4B5563]">
                    Cap. Factor
                  </th>
                  <th className="text-right px-3 py-2 text-xs font-semibold uppercase tracking-wide text-[#4B5563]">
                    Curtailment
                  </th>
                  <th className="px-3 py-2" />
                </tr>
              </thead>
              <tbody>
                {scenarios.map((sc, i) => (
                  <tr
                    key={sc.id}
                    className={i % 2 === 0 ? 'bg-white' : 'bg-[#FAFBFC]'}
                  >
                    <td className="px-3 py-2 text-[#111827] font-medium">{sc.name}</td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      {fmtDollar(sc.summary.annualTotalRevenue)}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      {fmtDollar(sc.summary.annualBatteryRevenue)}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      {fmtPct(sc.summary.capacityFactorPct)}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      {fmtPct(sc.summary.curtailmentPct)}
                    </td>
                    <td className="px-3 py-2 text-right">
                      <button
                        onClick={() => deleteScenario(sc.id)}
                        className="text-[#DC2626] text-xs hover:underline"
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Bar chart */}
          {scenarios.length > 1 && (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F3F5" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#4B5563' }} />
                <YAxis tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11, fill: '#4B5563' }} width={44} />
                <Tooltip
                  formatter={(v) => fmtDollar(Number(v ?? 0))}
                  contentStyle={{ fontSize: 12, borderRadius: 6 }}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="Gen Revenue" fill="#F59E0B" radius={[2, 2, 0, 0]} />
                <Bar dataKey="Battery Revenue" fill="#06B6D4" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </>
      )}
    </div>
  )
}
