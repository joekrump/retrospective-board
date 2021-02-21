import React from "react";

const MISSING_ERROR = "Error was swallowed during propagation.";

type AppErrorBoundaryState = {
  readonly error: Error | null | undefined;
};

class AppErrorBoundary extends React.Component {
  readonly state: AppErrorBoundaryState = {
    error: undefined,
  };

  constructor(props: any) {
    super(props);

  }

  static getDerivedStateFromError(error: any) {
    // Update state so the next render will show the fallback UI.
    return { hasError: true };
  }

  componentDidCatch(error: Error | null, info: object) {
    this.setState({ error: error || new Error(MISSING_ERROR) });
    this.logErrorToCloud(error, info);
  }

  logErrorToCloud = (error: Error | null, info: object) => {
    // TODO: send error report to service provider
    console.error(error);
    console.error(info);
  };

  render() {
    const { children } = this.props;
    const { error } = this.state;

    if (error) {
      return <div>Something unexpected occurred</div>;
    }

    return children;
  }
}

export { AppErrorBoundary };
