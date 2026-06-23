import { Component } from 'react'
import { Link } from 'react-router-dom'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error, info) {
    console.error('UI error boundary caught an error:', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="app-surface flex items-center justify-center px-6 py-16">
          <div className="card max-w-lg text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-lg bg-coral text-3xl font-extrabold text-white">
              !
            </div>
            <h1 className="mb-2 text-4xl font-bold text-dark">Something went wrong</h1>
            <p className="mb-6 text-muted">
              SyncUp hit an unexpected UI error. Refresh the page or head back to the dashboard.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <button onClick={() => window.location.reload()} className="btn-primary">
                Reload
              </button>
              <Link to="/dashboard" className="btn-secondary">
                Go to Dashboard
              </Link>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
