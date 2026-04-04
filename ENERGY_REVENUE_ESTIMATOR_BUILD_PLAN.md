# Energy Revenue Estimator — Build Plan

## Project Overview

A browser-based tool for estimating revenue from electrical generation (solar, wind, hydro, diesel, etc.) with optional battery storage arbitrage. Users upload hourly (8760) generation and price data, optionally configure a battery, and get interactive revenue analysis with rich visualizations.

All computation runs client-side. No server-side processing for calculations.

**Target audience:** Students and practitioners with mild-to-moderate energy market familiarity seeking grounded rough estimates.

---

## Tech Stack

| Layer | Choice | Rationale |
|---|---|---|
| Framework | React 18+ with Vite | Fast dev, good ecosystem |
| Language | TypeScript throughout | Type safety for complex data flows |
| Styling | Tailwind CSS | Rapid UI, no CSS files to manage |
| Charting | Recharts (line, bar, area) + custom canvas for heatmap | Recharts handles most charts; canvas needed for 365×24 heatmap performance |
| CSV parsing | PapaParse | Battle-tested, handles edge cases |
| State management | Zustand | Lightweight, reactive, good for real-time recalc |
| Table virtualization | @tanstack/react-virtual | Required for smooth scrolling of 8760-row tables |
| URL state | Native URLSearchParams | Config sharing without data |
| Deployment | Vercel (auto-deploy from GitHub) | Free tier, zero config |
| Future persistence | Supabase (SDK installed, not wired) | Stub for future user data storage |

---

## Core Design Principles

1. **Modularity:** Computation engine is pure TypeScript functions with zero React dependencies. Any engine function can be tested, reused, or called from a worker without importing React.
2. **Reusability:** Ingestion pipeline, battery dispatch, and aggregation are generic — not hardcoded to solar or any specific market.
3. **Sub-hourly ready:** All data types use timestamp-based records, not hardcoded 8760 lengths. Interval is inferred. When sub-hourly support is added, the main changes are in ingestion detection and UI labels — not the engine.
4. **Reactive updates:** Battery config changes (capacity, efficiency, strategy, charge rates) trigger immediate recalculation and chart updates via Zustand subscriptions + debounced compute.

---

## File Structure

```
energy-revenue-estimator/
├── public/
│   └── examples/
│       ├── manifest.json                ← registry of available example files
│       ├── solar_gen_vertical.csv       ← provided example: vertical format
│       ├── ercot_prices_wide.csv        ← provided example: wide format
│       └── README.md                    ← describes each file's source/units/tz
│
├── src/
│   ├── app/
│   │   ├── App.tsx                      ← layout shell, tab/step navigation
│   │   └── main.tsx                     ← entry point
│   │
│   ├── stores/
│   │   ├── projectStore.ts              ← central Zustand store (see details below)
│   │   └── uiStore.ts                   ← UI state: active tab, selected time range
│   │
│   ├── types/
│   │   ├── timeseries.ts                ← HourlyRecord, TimeSeries, TimeSeriesMetadata
│   │   ├── battery.ts                   ← BatteryConfig, BatteryState, DispatchStrategy
│   │   ├── revenue.ts                   ← RevenueResult, RevenueSummary
│   │   └── project.ts                   ← top-level ProjectState
│   │
│   ├── ingestion/
│   │   ├── parseCSV.ts                  ← PapaParse wrapper
│   │   ├── detectFormat.ts              ← vertical vs wide detection
│   │   ├── columnMapper.ts              ← column mapping logic
│   │   ├── normalizeTimeSeries.ts       ← format → TimeSeries conversion
│   │   ├── validators.ts               ← gap/duplicate/length validation
│   │   └── index.ts
│   │
│   ├── engine/
│   │   ├── revenue.ts                   ← merchant revenue calculation
│   │   ├── battery/
│   │   │   ├── types.ts                 ← DispatchStrategyFn signature
│   │   │   ├── greedy.ts                ← greedy dispatch strategy
│   │   │   ├── strikePrice.ts           ← threshold-based strategy
│   │   │   ├── placeholder.ts           ← stub for future custom rules
│   │   │   ├── dispatch.ts              ← core dispatch loop
│   │   │   └── index.ts
│   │   ├── selfConsumption.ts           ← net generation after consumption
│   │   ├── aggregations.ts             ← rollups, averages, duration curves, stats
│   │   ├── scaling.ts                   ← generation multiplier
│   │   └── index.ts
│   │
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Header.tsx
│   │   │   ├── StepNav.tsx              ← Import → Configure → Results
│   │   │   └── Footer.tsx
│   │   ├── import/
│   │   │   ├── FileUploader.tsx
│   │   │   ├── ColumnMapper.tsx
│   │   │   ├── TimezoneSelector.tsx
│   │   │   ├── UnitSelector.tsx
│   │   │   ├── ExampleDataLoader.tsx    ← dropdown fed by manifest.json
│   │   │   └── ImportSummary.tsx
│   │   ├── config/
│   │   │   ├── BatteryPanel.tsx
│   │   │   ├── GenerationScaler.tsx
│   │   │   ├── CurtailmentNote.tsx
│   │   │   └── CostStubs.tsx
│   │   ├── results/
│   │   │   ├── SummaryCards.tsx
│   │   │   ├── MonthlyBreakdown.tsx
│   │   │   ├── ScenarioCompare.tsx
│   │   │   └── RevenueTable.tsx
│   │   ├── charts/
│   │   │   ├── IntensityHeatmap.tsx
│   │   │   ├── LineByDay.tsx
│   │   │   ├── HourlyAverages.tsx
│   │   │   ├── DurationCurve.tsx
│   │   │   ├── TimeSeriesLine.tsx
│   │   │   └── ChartWrapper.tsx
│   │   └── shared/
│   │       ├── DataTable.tsx
│   │       ├── SliderInput.tsx
│   │       ├── ToggleSwitch.tsx
│   │       ├── Tooltip.tsx
│   │       └── ExportButton.tsx
│   │
│   ├── utils/
│   │   ├── timezone.ts
│   │   ├── units.ts
│   │   ├── formatters.ts
│   │   ├── urlState.ts
│   │   └── csv.ts
│   │
│   └── hooks/
│       ├── useCalculation.ts
│       ├── useImport.ts
│       └── useChartInteraction.ts
│
├── tests/
│   └── ingestion/
│       ├── parseCSV.test.ts
│       ├── detectFormat.test.ts
│       └── normalizeTimeSeries.test.ts
│
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── vite.config.ts
├── vercel.json
└── README.md
```

---

## Type Definitions

### `types/timeseries.ts`

```typescript
export interface HourlyRecord {
  timestamp: Date;   // Always stored as UTC internally
  value: number;
}

export type TimeSeries = HourlyRecord[];

export type DataUnit = 'kWh' | 'MWh';
export type PowerUnit = 'kW' | 'MW';

export interface TimeSeriesMetadata {
  timezone: string;          // IANA timezone string, e.g. "America/Chicago"
  unit: DataUnit;
  sourceFilename: string;
  format: 'vertical' | 'wide';
  recordCount: number;
  startDate: Date;
  endDate: Date;
  warnings: string[];        // e.g. "3 gaps detected", "contains negative values"
}

// Future sub-hourly: interval is inferred from timestamp spacing.
// Engine functions accept TimeSeries[] and do not hardcode length = 8760.
```

### `types/battery.ts`

```typescript
export interface BatteryConfig {
  enabled: boolean;
  capacityKWh: number;
  maxChargeRateKW: number;
  maxDischargeRateKW: number;
  roundTripEfficiency: number;    // 0-1, default 0.85
  gridChargingEnabled: boolean;
  strategy: DispatchStrategyId;
  strikePriceConfig: {
    buyBelowPrice: number;        // $/MWh — charge when price is below this
    sellAbovePrice: number;       // $/MWh — discharge when price is above this
  };
}

export type DispatchStrategyId = 'greedy' | 'strikePrice' | 'custom';

export interface BatteryState {
  socKWh: number;                 // current state of charge
  hour: number;
}

export interface ChargeAction {
  chargeKWh: number;             // positive = charging, negative = discharging
}

export type DispatchStrategyFn = (
  hour: number,
  state: BatteryState,
  priceAtHour: number,
  generationAtHour: number,
  consumptionAtHour: number,
  config: BatteryConfig
) => ChargeAction;

export interface BatteryScheduleEntry {
  timestamp: Date;
  chargeKWh: number;             // positive = charging
  dischargeKWh: number;          // positive = discharging (after efficiency)
  socKWh: number;                // state of charge after this hour
  batteryRevenueUSD: number;     // revenue from discharge (or cost from charge)
}

export type BatterySchedule = BatteryScheduleEntry[];
```

### `types/revenue.ts`

```typescript
export interface HourlyRevenueRecord {
  timestamp: Date;
  generationKWh: number;         // after curtailment and scaling
  curtailedKWh: number;          // generation zeroed due to negative prices
  pricePerMWh: number;           // energy + capacity summed
  energyPricePerMWh: number;
  capacityPricePerMWh: number;
  solarRevenueUSD: number;       // generation × price (0 if curtailed)
  consumptionKWh: number;
  batteryChargeKWh: number;
  batteryDischargeKWh: number;
  batterySOCKWh: number;
  batteryRevenueUSD: number;
  totalRevenueUSD: number;
}

export interface RevenueSummary {
  totalGenerationMWh: number;
  totalCurtailedMWh: number;
  capacityFactor: number;             // percentage
  averagePricePerMWh: number;
  solarOnlyRevenueUSD: number;
  batteryOnlyRevenueUSD: number;
  totalSystemRevenueUSD: number;
  revenuePerKW: number;               // $/kW installed (needs system size input)
  batteryCyclesPerYear: number;
  batteryUtilizationRate: number;     // percentage of hours active
  monthlyBreakdown: MonthlyRevenue[];
}

export interface MonthlyRevenue {
  month: number;                      // 1-12
  solarRevenueUSD: number;
  batteryRevenueUSD: number;
  totalRevenueUSD: number;
  generationMWh: number;
  curtailedMWh: number;
  averagePricePerMWh: number;
}
```

---

## Detailed Module Specifications

### Ingestion Pipeline

#### `ingestion/parseCSV.ts`

Wraps PapaParse. Returns `{ headers: string[], rows: string[][], rawText: string }`. Handles common CSV issues: BOM markers, trailing commas, inconsistent delimiters (auto-detect). Does NOT interpret data — just returns raw strings.

#### `ingestion/detectFormat.ts`

Determines if data is vertical (one timestamp + one value column, ~8760 rows) or wide (one date column + 24 hour columns, ~365 rows).

**Detection heuristic:**
1. If column count >= 25 and row count is between 360-370 → likely wide format.
2. For wide format, identify the hour anchor: scan the first row of data columns (excluding the date column) for values. Look at the column headers — search for "0", "1", "12", "00", "01", "H0", "H1", "Hour 0", "Hour 1", "12am", "1am" etc. The key insight: just find which column represents the first hour, then assume 24 consecutive columns from there.
3. If column count is small (2-5) and row count is ~8760 → vertical format.
4. Return `{ format: 'vertical' | 'wide', hourAnchorColumn?: number, dateColumn?: number, valueColumn?: number }`.

#### `ingestion/columnMapper.ts`

Provides suggested column mappings based on header names and data inspection. Returns a `ColumnMapping` object. The UI (ColumnMapper.tsx) lets the user override any suggestion via dropdowns.

For vertical: identify timestamp column (look for date-like strings) and value column (look for numeric data).

For wide: identify date column and the 24 hour columns (starting from the detected anchor).

#### `ingestion/normalizeTimeSeries.ts`

Converts parsed + mapped data into a `TimeSeries` (array of `HourlyRecord`).

Steps:
1. Parse dates from the identified column(s).
2. For wide format: unpivot 24 columns into 24 rows per date.
3. Apply timezone shift: convert from declared source timezone to UTC for internal storage.
4. Apply unit conversion: if source is kWh, convert to kWh (internal unit). If MWh, multiply by 1000. (Store everything in kWh internally, display in user-selected units.)
5. Sort by timestamp ascending.
6. Validate: check for exactly 8760 records (or 8784 for leap year). Report gaps.

**Important:** Timezone remains user-adjustable after import. Changing the timezone triggers re-normalization from the raw parsed data (keep raw data in store).

#### `ingestion/validators.ts`

Run after normalization. Returns an array of warning strings:
- Record count != 8760 (or 8784)
- Gaps in timestamp sequence (missing hours)
- Duplicate timestamps
- Negative values in generation data (likely error)
- Extremely high values (outlier detection — flag but don't block)

---

### Computation Engine

All functions in `engine/` are pure TypeScript. No React imports. No side effects. They take typed inputs and return typed outputs.

#### `engine/revenue.ts`

```typescript
function calculateMerchantRevenue(
  generation: TimeSeries,          // in kWh
  energyPrices: TimeSeries,        // in $/MWh
  capacityPrices: TimeSeries | null, // in $/MWh, optional
  scalingFactor: number            // default 1.0
): HourlyRevenueRecord[]
```

For each hour:
1. `effectiveGeneration = generation[h].value * scalingFactor`
2. `totalPrice = energyPrices[h].value + (capacityPrices?.[h].value ?? 0)`
3. If `totalPrice < 0`: set `effectiveGeneration = 0`, record curtailed amount.
4. `solarRevenue = (effectiveGeneration / 1000) * totalPrice` (kWh → MWh for price calc)

#### `engine/battery/dispatch.ts`

```typescript
function runBatteryDispatch(
  config: BatteryConfig,
  strategy: DispatchStrategyFn,
  generation: TimeSeries,
  prices: TimeSeries,               // combined energy + capacity
  consumption: TimeSeries | null
): BatterySchedule
```

Sequential loop, hour 0 → N:
1. Call `strategy(hour, currentState, price, gen, consumption, config)` → `ChargeAction`
2. Clip charge action to:
   - Max charge rate (kW = kWh per hour for hourly data)
   - Available capacity (can't exceed `capacityKWh - currentSOC`)
   - If grid charging disabled: can't charge more than `netGeneration` (generation - consumption) in that hour
   - Can't discharge below 0 SOC
   - Max discharge rate
3. Apply round-trip efficiency: efficiency loss is applied on discharge.
   - When charging: `socIncrease = chargeKWh` (full amount stored)
   - When discharging: `deliveredKWh = dischargeKWh * roundTripEfficiency`
   - Revenue from discharge: `deliveredKWh / 1000 * pricePerMWh`
   - Cost of charging: `chargeKWh / 1000 * pricePerMWh` (buying from grid or opportunity cost)
4. Update SOC, record entry.

#### `engine/battery/greedy.ts`

Greedy strategy implementation:

This requires a look-ahead within a defined window (e.g., 24 hours). For each hour:
1. Look at prices for the next 24 hours.
2. If current price is in the bottom tercile of the window → charge.
3. If current price is in the top tercile → discharge.
4. Otherwise → hold.

The strategy function signature means it receives only the current hour's data. To enable look-ahead, the greedy strategy should be initialized with the full price series (closure pattern):

```typescript
function createGreedyStrategy(allPrices: TimeSeries): DispatchStrategyFn {
  // Pre-compute charge/discharge decisions for all hours
  // Return a function that looks up the pre-computed decision
}
```

#### `engine/battery/strikePrice.ts`

Simple threshold strategy:
- If price < `buyBelowPrice` → charge at max rate
- If price > `sellAbovePrice` → discharge at max rate
- Otherwise → hold

#### `engine/battery/placeholder.ts`

Stub file. Contains:
- A no-op strategy that always returns `{ chargeKWh: 0 }`
- Extensive comments describing the planned "custom rules" interface:
  - Rule-based dispatch: user defines ordered rules like "charge to 50% when price < $50", "charge maximally when price < $20", "discharge completely before 10am"
  - Rules evaluated top-to-bottom, first match wins
  - UI would be a rule builder with dropdowns and inputs
  - All rules are based on past data or user-defined parameters — no future knowledge

#### `engine/selfConsumption.ts`

```typescript
function applyConsumption(
  generation: TimeSeries,
  consumption: TimeSeries
): TimeSeries  // net generation = max(0, gen - consumption)
```

For now, consumption simply reduces available generation. The economic impact is equivalent to selling to grid and buying back (same price both ways).

Stub comment: "Future: add retail rate vs wholesale differential. When retail rate > wholesale, self-consumption has additional value = consumption × (retail - wholesale)."

#### `engine/aggregations.ts`

Functions for computing:
- `monthlyRollup(hourlyData) → MonthlyRevenue[]`
- `hourlyAverages(hourlyData) → { hour: number, avgValue: number, weekdayAvg: number, weekendAvg: number }[]`
- `durationCurve(values) → number[]` (sorted descending)
- `capacityFactor(generation, systemSizeKW) → number`
- `batteryCycles(schedule) → number` (total discharge / capacity)
- `batteryUtilization(schedule) → number` (hours with charge or discharge / total hours)

#### `engine/scaling.ts`

```typescript
function scaleGeneration(generation: TimeSeries, factor: number): TimeSeries
```

Simple multiplication. Factor range: 0.5 to 2.0 (enforced in UI, not in engine).

---

### State Management

#### `stores/projectStore.ts`

Central Zustand store. Shape:

```typescript
interface ProjectState {
  // Raw imported data (kept for re-normalization on timezone change)
  rawGeneration: { headers: string[], rows: string[][], mapping: ColumnMapping } | null;
  rawEnergyPrices: { ... } | null;
  rawCapacityPrices: { ... } | null;
  rawConsumption: { ... } | null;

  // Normalized time series (UTC, kWh)
  generation: TimeSeries | null;
  energyPrices: TimeSeries | null;
  capacityPrices: TimeSeries | null;
  consumption: TimeSeries | null;

  // Metadata per series
  generationMeta: TimeSeriesMetadata | null;
  energyPricesMeta: TimeSeriesMetadata | null;
  capacityPricesMeta: TimeSeriesMetadata | null;
  consumptionMeta: TimeSeriesMetadata | null;

  // Configuration
  batteryConfig: BatteryConfig;
  generationScalingFactor: number;   // default 1.0

  // Results (computed by useCalculation hook)
  hourlyResults: HourlyRevenueRecord[] | null;
  batterySchedule: BatterySchedule | null;
  summary: RevenueSummary | null;

  // Scenarios
  savedScenarios: SavedScenario[];   // { name, batteryConfig, scalingFactor, summary }

  // Actions
  setGeneration: (raw, meta) => void;
  setEnergyPrices: (raw, meta) => void;
  // ... etc
  updateBatteryConfig: (partial: Partial<BatteryConfig>) => void;
  saveCurrentScenario: (name: string) => void;
  deleteScenario: (name: string) => void;
}
```

#### `stores/uiStore.ts`

```typescript
interface UIState {
  activeStep: 'import' | 'configure' | 'results';
  activeChartTab: string;
  selectedDay: number | null;           // for LineByDay chart
  brushRange: [number, number] | null;  // for TimeSeriesLine zoom
}
```

---

### Component Specifications

#### Import Step

**FileUploader.tsx**: Drag-drop zone or click-to-browse. Four labeled slots: "Generation" (required), "Energy Price" (required), "Capacity Price" (optional), "Consumption Profile" (optional). Accepts .csv and .tsv files. After file selection, triggers the ingestion pipeline and opens the ColumnMapper.

**ExampleDataLoader.tsx**: Above each FileUploader slot, a dropdown: "Or load an example →". On mount, fetches `/examples/manifest.json`. Filters entries by `type` matching the slot. On selection: fetches the CSV file, auto-applies the timezone/unit/format from the manifest, skips column mapping, and populates the store. User can still change timezone/units after loading.

**ColumnMapper.tsx**: Modal or expandable panel shown after file parse. Displays:
- Detected format (vertical/wide) with option to override.
- For vertical: dropdown to select timestamp column and value column. Shows auto-detected suggestion highlighted.
- For wide: dropdown to select date column. Shows detected hour anchor column. User can shift the anchor if detection was wrong.
- Preview table: first 10 rows of data as it will be interpreted with current mappings.
- "Confirm" button triggers normalization.

**TimezoneSelector.tsx**: Dropdown of IANA timezone strings (grouped by region). Shown per uploaded file. Remains editable on the Configure step too. Changing triggers re-normalization from raw data.

**UnitSelector.tsx**: Toggle between kWh and MWh per file. For price files: $/kWh or $/MWh.

**ImportSummary.tsx**: After successful import, shows: filename, record count, date range, detected format, any warnings from validators. Warnings in yellow with explanatory text.

#### Configure Step

**BatteryPanel.tsx**: Toggle to enable/disable battery. When enabled, shows:
- Capacity input (number + unit toggle kWh/MWh)
- Max charge rate input (number + unit toggle kW/MW)
- Max discharge rate input (number + unit toggle kW/MW)
- Round-trip efficiency slider (50%–100%, default 85%)
- Grid charging toggle (on/off)
- Dispatch strategy dropdown (Greedy, Strike Price, Custom — custom is disabled/grayed)
- When "Strike Price" selected: two number inputs for buy-below and sell-above thresholds ($/MWh)
- All changes trigger immediate recalculation (debounced ~100ms)

**GenerationScaler.tsx**: Slider from 0.5x to 2.0x with numeric input. Default 1.0x. Label: "Scale generation output (model different system sizes)".

**CurtailmentNote.tsx**: Info card: "Generation is automatically curtailed (set to zero) during hours when the combined energy + capacity price is negative."

**CostStubs.tsx**: Grayed-out card: "Additional cost inputs coming soon: O&M costs, demand charges, interconnection fees, degradation." Non-interactive placeholder.

#### Results Step

**SummaryCards.tsx**: Grid of metric cards:
- Total Generation (MWh)
- Curtailed Generation (MWh)
- Capacity Factor (%) — requires a system size input; if not provided, skip this card or estimate from peak generation
- Average Price ($/MWh)
- Solar-Only Revenue ($)
- Battery-Only Revenue ($)
- Total System Revenue ($)
- Revenue per kW ($/kW) — same caveat as capacity factor
- Battery Cycles/Year
- Battery Utilization (%)
- Each card has an info tooltip explaining the metric.

**MonthlyBreakdown.tsx**: Stacked bar chart (Recharts): X = month, Y = revenue ($). Two stacks: solar revenue (one color) and battery revenue (another). Table below the chart with monthly numeric totals for generation, curtailment, avg price, solar revenue, battery revenue, total revenue.

**ScenarioCompare.tsx**: "Save Current Scenario" button + name input. List of saved scenarios (stored in Zustand, lost on refresh — future: persist to Supabase). Side-by-side grouped bar chart comparing total revenue, solar revenue, battery revenue across up to 4 saved scenarios. Delete button per scenario.

**RevenueTable.tsx**: Virtualized scrollable table showing all `HourlyRevenueRecord` fields. Columns: Timestamp, Generation (kWh), Curtailed (kWh), Energy Price ($/MWh), Capacity Price ($/MWh), Total Price ($/MWh), Solar Revenue ($), Consumption (kWh), Battery Charge (kWh), Battery Discharge (kWh), Battery SOC (kWh), Battery Revenue ($), Total Revenue ($). CSV export button at top.

#### Charts

**ChartWrapper.tsx**: Shared wrapper for all charts. Provides: title bar, dropdown to select data series (where applicable), download-as-PNG button (html2canvas or Recharts native), expand-to-fullscreen button.

**IntensityHeatmap.tsx**: Canvas-rendered heatmap.
- X axis: day of year (1–365). Y axis: hour of day (0–23). Color: magnitude of selected variable.
- Dropdown to select variable: Generation, Energy Price, Total Price, Solar Revenue, Battery SOC, Battery Charge/Discharge, Total Revenue.
- Color scale: diverging palette (blue → white → red) for prices and revenue (to show negative values). Sequential palette (white → orange → red) for generation. Sequential (white → green) for SOC.
- Clicking a column (day) updates the `selectedDay` in uiStore, which LineByDay picks up.
- Tooltip on hover: shows date, hour, and exact value.

**TimeSeriesLine.tsx**: Full-year line chart with Recharts Brush component for zoom/pan.
- Multi-series toggle: show/hide generation, price, revenue lines.
- Dual Y-axis: left for kWh/MWh quantities, right for $/MWh prices.
- Click-drag the brush to zoom into any time range.

**LineByDay.tsx**: 24-hour line chart for a single selected day.
- Day picker input (date selector) or auto-selected from heatmap click.
- Shows generation, price, SOC, and charge/discharge as separate lines or overlaid with dual axes.
- Useful for inspecting battery behavior on specific days.

**HourlyAverages.tsx**: Bar or line chart showing average value per hour (0–23) across the full year.
- Toggle: weekday vs weekend breakdown (two lines/bar groups).
- Variable selector: generation, price, revenue.
- This is the "time-of-day price/generation shape" chart — very standard in energy analysis.

**DurationCurve.tsx**: Sorted descending line chart.
- Toggle between: price duration curve, generation duration curve.
- X axis: hours (1–8760), Y axis: value.
- Shows what percentage of hours exceed a given price/generation level.

#### Shared Components

**DataTable.tsx**: Virtualized table component using @tanstack/react-virtual. Supports: column headers, fixed-width columns, horizontal scroll, row striping. Used by RevenueTable and any other tabular display. Read-only for now (no inline editing). Stub comment: "Future: add inline editing with onCellChange callback."

**SliderInput.tsx**: Labeled slider with a numeric input box beside it. Supports min/max/step. Used for efficiency, scaling factor, strike prices.

**ToggleSwitch.tsx**: Labeled on/off toggle. Used for battery enable, grid charging.

**Tooltip.tsx**: Info icon that shows explanatory text on hover/tap. Used for jargon: "capacity factor", "round-trip efficiency", "curtailment", "duration curve", "state of charge", etc.

**ExportButton.tsx**: Button that generates a CSV from an array of objects and triggers a browser download. Column headers from object keys. Used on RevenueTable, MonthlyBreakdown table, and any other exportable data.

---

### Hooks

#### `hooks/useCalculation.ts`

Subscribes to projectStore (generation, prices, consumption, batteryConfig, scalingFactor). On any change:
1. Debounce 100ms.
2. If generation and prices are both present:
   a. Apply scaling.
   b. Calculate merchant revenue.
   c. If battery enabled: run battery dispatch with selected strategy.
   d. If consumption provided: apply self-consumption netting.
   e. Compute aggregations and summary.
   f. Write results back to store.
3. If computation takes >200ms, consider moving to a web worker (optimization note — don't build the worker initially, but structure the engine so it could be called from one).

#### `hooks/useImport.ts`

Orchestrates the full import flow for a single file:
1. Parse CSV → raw rows + headers.
2. Detect format → vertical or wide.
3. Present column mapper UI (via state).
4. On user confirm: normalize to TimeSeries.
5. Run validators.
6. Store raw data, normalized data, and metadata in projectStore.

#### `hooks/useChartInteraction.ts`

Manages shared interactive state across charts:
- `selectedDay`: set by heatmap click, consumed by LineByDay.
- `brushRange`: set by TimeSeriesLine drag, could filter other charts.
- `selectedVariable`: shared across heatmap and other variable-selectable charts.

---

### Example Data System

#### `public/examples/manifest.json`

```json
[
  {
    "id": "solar_gen_vertical",
    "label": "Solar Generation — Central TX, 2023",
    "file": "solar_gen_vertical.csv",
    "type": "generation",
    "format": "vertical",
    "unit": "kWh",
    "timezone": "America/Chicago"
  },
  {
    "id": "ercot_prices_wide",
    "label": "ERCOT LZ Houston Energy Price, 2023",
    "file": "ercot_prices_wide.csv",
    "type": "energy_price",
    "format": "wide",
    "unit": "MWh",
    "timezone": "America/Chicago"
  }
]
```

Admin workflow to add examples: drop CSV into `public/examples/`, add an entry to `manifest.json`, push to GitHub. Vercel auto-deploys. No code changes required.

#### `public/examples/README.md`

Describes each example file: source, date range, units, timezone, any known quirks. Serves as documentation for both developers and curious users.

---

### URL State

#### `utils/urlState.ts`

Encodes the following into URL search parameters:
- Battery config (all fields)
- Generation scaling factor
- Active dispatch strategy + strike prices
- Active UI tab

Does NOT encode uploaded data (too large). A shared URL means the recipient sees the same config but must upload their own data (or load an example).

Format: `?battery=on&cap=5000&chargeRate=2500&...&strategy=greedy&scale=1.2`

Encode on config change (debounced). Decode on page load (hydrate store from URL if params present).

Stub comment: "Future: with Supabase, store datasets server-side and include a dataset ID in the URL for full scenario sharing."

---

### Negative Price & Curtailment Logic

When the combined price (energy + capacity) is negative for a given hour:
1. Generation output is set to zero (curtailed). Solar revenue = $0 for that hour.
2. The curtailed kWh amount is tracked in `curtailedKWh`.
3. Battery CAN still discharge during negative price hours if the dispatch strategy says to — but this would result in negative battery revenue for that hour. The strategy implementations should generally avoid this, but the engine does not hard-block it. This lets users see the impact of poorly-configured strategies.
4. Battery CAN charge during negative price hours — this means being paid to charge, which is a valid and profitable arbitrage move. Greedy strategy should recognize this.

---

### Performance Notes

- **8760 × ~13 columns ≈ 114K data points**: well within client-side JS capabilities. Computation should complete in <50ms on modern hardware.
- **Heatmap (365 × 24 = 8,760 cells)**: must use canvas, not SVG/DOM elements. Each cell is a filled rectangle. Tooltip via mouse position math, not DOM event listeners per cell.
- **Tables (8760 rows)**: must use virtualized scrolling (@tanstack/react-virtual). Only render ~50 visible rows at a time.
- **Debounced recalculation**: slider drags generate many rapid changes. Debounce engine recalculation to ~100ms to avoid jank.
- **Web worker stub**: structure engine functions so they could be moved to a worker if needed. For now, run on main thread. Add a comment in `useCalculation.ts`: "If recalculation exceeds 200ms, move engine calls to a web worker."

---

### Future Stubs (comments only, not built)

Each of these should be a code comment in the relevant file describing what would be built:

1. **Custom rule-based battery dispatch** (`engine/battery/placeholder.ts`): Ordered rules evaluated top-to-bottom. Rule format: `{ condition: "price < 50", action: "charge to 50%" }`. UI: rule builder with add/remove/reorder.

2. **Retail rate vs wholesale differential** (`engine/selfConsumption.ts`): When retail rate > wholesale, self-consumption value = consumption × (retail - wholesale). Requires additional input for retail rate schedule.

3. **O&M / demand charges / interconnection fees** (`components/config/CostStubs.tsx`): Additional cost inputs that reduce net revenue. Grayed-out UI placeholder.

4. **Inline table editing** (`components/shared/DataTable.tsx`): Click a cell to edit. Changes propagate back through the calculation pipeline.

5. **Supabase persistence** (`supabase.ts` stub file): Store user datasets, saved scenarios, and project state. Enable full URL sharing with dataset IDs.

6. **Sub-hourly resolution** (`types/timeseries.ts`): Interval detection in ingestion. Engine functions already accept variable-length arrays. UI labels would need to adapt ("hourly" → "15-minute" etc.).

7. **PPA / contract price comparison**: Input a fixed $/MWh PPA price, compute contracted revenue alongside merchant revenue, show the delta.

8. **ITC/PTC toggle**: Add a $/MWh production tax credit adder to revenue calculations for US solar/wind projects.

---

### Build Phases

#### Phase 1 — Scaffold & Ingestion
1. Initialize Vite + React + TypeScript + Tailwind project.
2. Install dependencies: `papaparse`, `zustand`, `recharts`, `@tanstack/react-virtual`, `@supabase/supabase-js`.
3. Create all files in `types/` with the interfaces defined above.
4. Build `ingestion/` module: parseCSV, detectFormat, columnMapper, normalizeTimeSeries, validators.
5. Build `stores/projectStore.ts` with initial shape.
6. Build import UI components: FileUploader, ColumnMapper, TimezoneSelector, UnitSelector, ImportSummary, ExampleDataLoader.
7. Set up `public/examples/` with manifest.json, provided example files, and README.
8. Write ingestion tests in `tests/ingestion/` using the example files.
9. **Milestone:** User can upload a CSV (or load an example), map columns, select timezone/units, and see normalized data in a basic table. All ingestion paths (vertical + wide) work.

#### Phase 2 — Engine & Revenue
1. Build `engine/revenue.ts` with negative price curtailment.
2. Build `engine/battery/dispatch.ts`, `greedy.ts`, `strikePrice.ts`, `placeholder.ts`.
3. Build `engine/selfConsumption.ts` and `engine/scaling.ts`.
4. Build `engine/aggregations.ts` (monthly rollups, hourly averages, duration curves, summary stats).
5. Build `hooks/useCalculation.ts` wiring store → engine → results.
6. **Milestone:** Changing battery config in store produces correct revenue numbers. Verify by logging to console or with unit tests against expected values from example data.

#### Phase 3 — Config UI & Summary
1. Build BatteryPanel, GenerationScaler, CurtailmentNote, CostStubs.
2. Build SummaryCards, MonthlyBreakdown (chart + table), RevenueTable (virtualized + CSV export).
3. Build StepNav (Import → Configure → Results flow).
4. **Milestone:** Full flow from import → configure battery → see revenue summary and monthly breakdown. Battery config changes update results in real time.

#### Phase 4 — Visualizations
1. Build ChartWrapper (shared frame, PNG export, fullscreen toggle).
2. Build IntensityHeatmap (canvas-based, variable selector, diverging/sequential color scales).
3. Build TimeSeriesLine (full-year with Recharts Brush for zoom).
4. Build LineByDay (single-day view, linked to heatmap click).
5. Build HourlyAverages (weekday/weekend toggle, variable selector).
6. Build DurationCurve (price + generation toggle).
7. Wire chart interactions: heatmap click → LineByDay, shared brush state.
8. **Milestone:** All charts render correctly with example data. Interactive linking between heatmap and day view works.

#### Phase 5 — Polish & Features
1. ScenarioCompare: save/name/compare up to 4 battery configs side-by-side.
2. URL state encoding/decoding for config sharing.
3. CSV export on all tables (RevenueTable, MonthlyBreakdown).
4. Info tooltips on all jargon terms.
5. Responsive layout: works well on desktop and tablet. Phone layout degrades gracefully (stack charts vertically, simplify heatmap).
6. Error boundaries around each major section. Loading spinners during calculation. Empty states with guidance ("Upload generation data to get started").
7. **Milestone:** App is polished, all features work end-to-end, tooltips explain terminology, export works.

#### Phase 6 — Deployment
1. Create GitHub repository with README (project description, setup instructions, tech stack, example data info).
2. Configure Vercel project linked to the repo (auto-deploy on push to main).
3. Add `vercel.json` if needed (likely not — Vite projects deploy with zero config).
4. Create `supabase.ts` stub file with comments describing future persistence layer.
5. Final README updates: live URL, screenshots, contribution guide.
6. **Milestone:** App is live on Vercel, source is on GitHub, README is complete.

---

### Testing Strategy

**Ingestion tests (Phase 1):**
- `parseCSV.test.ts`: Correctly parses provided example files. Handles BOM, trailing commas.
- `detectFormat.test.ts`: Correctly identifies vertical vs wide format for both examples. Correctly anchors hour column in wide format.
- `normalizeTimeSeries.test.ts`: Outputs correct number of records. Timestamps are in UTC. Values match expected after unit conversion.

**Engine tests (Phase 2):**
- Revenue calculation with known inputs → expected outputs.
- Battery dispatch: greedy strategy charges during cheapest hours, discharges during most expensive.
- Battery dispatch: strike price strategy respects thresholds.
- Curtailment: generation zeroed during negative price hours.
- Round-trip efficiency: discharged energy = stored energy × efficiency.
- Grid charging toggle: when off, charge cannot exceed net generation.

**Use the provided example data files as primary test fixtures.** Compute expected revenue manually for a few specific hours/days and assert engine output matches.
