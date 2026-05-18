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
        <div className="min-h-screen bg-light px-6 py-16 flex items-center justify-center">
          <div className="card max-w-lg text-center">
            <div className="w-16 h-16 rounded-full bg-card flex items-center justify-center text-3xl mx-auto mb-4">
              !
            </div>
            <h1 className="text-2xl font-extrabold text-dark mb-2">Something went wrong</h1>
            <p className="text-dark/60 mb-6">
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
