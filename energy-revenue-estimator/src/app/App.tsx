import { useProjectStore } from '../stores/projectStore'
import { useCalculation } from '../hooks/useCalculation'
import { Layout } from './Layout'
import { ImportStep } from '../components/import/ImportStep'
import { ConfigStep } from '../components/config/ConfigStep'
import { ResultsStep } from '../components/results/ResultsStep'

export function App() {
  useCalculation()

  const activeStep = useProjectStore(s => s.activeStep)

  return (
    <Layout>
      {activeStep === 'import' && <ImportStep />}
      {activeStep === 'configure' && <ConfigStep />}
      {activeStep === 'results' && <ResultsStep />}
    </Layout>
  )
}
