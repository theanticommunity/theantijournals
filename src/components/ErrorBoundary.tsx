import { Component, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = { hasError: false };

  public static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center px-4">
          <div className="max-w-md w-full text-center">
            <div className="masthead mb-2">AntiJournals</div>
            <h1 className="text-3xl font-serif text-black mb-6">Something went wrong</h1>
            <p className="text-secondary-grey text-sm mb-10">
              We encountered an unexpected error. Please try again later.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="btn inline-block"
            >
              Reload page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
