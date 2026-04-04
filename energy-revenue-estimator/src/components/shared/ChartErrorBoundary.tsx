import { Component, type ReactNode, type ErrorInfo } from 'react'

interface Props {
  children: ReactNode
  label?: string
}

interface State {
  hasError: boolean
  message: string
}

export class ChartErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: '' }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message }
  }

  componentDidCatch(_error: Error, info: ErrorInfo) {
    console.error('Chart error:', info.componentStack)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="bg-[#FEF2F2] border-l-4 border-[#DC2626] rounded-lg p-4 flex items-start gap-2">
          <span className="text-[#DC2626] mt-0.5">✕</span>
          <div>
            <p className="text-sm font-medium text-[#111827]">
              {this.props.label ?? 'Chart'} failed to render
            </p>
            <p className="text-xs text-[#4B5563] mt-1">{this.state.message}</p>
            <button
              className="text-xs text-[#2563EB] mt-2 underline"
              onClick={() => this.setState({ hasError: false, message: '' })}
            >
              Retry
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
