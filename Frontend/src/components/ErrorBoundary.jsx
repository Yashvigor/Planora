import React from 'react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        this.setState({ error, errorInfo });
        console.error("Uncaught error:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="p-8 bg-red-50 min-h-screen text-red-900">
                    <h1 className="text-3xl font-bold mb-4">Something went wrong.</h1>
                    <div className="bg-white p-6 rounded-lg shadow-md border border-red-200">
                        <h2 className="text-xl font-semibold mb-2 text-red-700">Error Details:</h2>
                        <pre className="bg-gray-100 p-4 rounded overflow-auto text-sm font-mono text-gray-800">
                            {this.state.error && this.state.error.toString()}
                        </pre>
                        <h3 className="text-lg font-semibold mt-4 mb-2 text-red-700">Component Stack:</h3>
                        <pre className="bg-gray-100 p-4 rounded overflow-auto text-xs font-mono text-gray-600">
                            {this.state.errorInfo && this.state.errorInfo.componentStack}
                        </pre>
                    </div>
                    <button
                        onClick={() => window.location.reload()}
                        className="mt-6 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-bold"
                    >
                        Reload Page
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
