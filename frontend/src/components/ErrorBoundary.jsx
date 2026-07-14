import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("3D Component Error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="w-full h-full flex items-center justify-center bg-gray-50/50 rounded-2xl border border-red-100">
          <div className="text-center text-red-500 font-medium">
            3D Rendering Unavailable
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
