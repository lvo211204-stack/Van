import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  errorMsg: string;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    errorMsg: ''
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, errorMsg: error.message };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  private handleReset = () => {
    localStorage.removeItem('activeStoryId');
    localStorage.removeItem('activeChapterId');
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-6 text-center">
          <h1 className="text-3xl font-bold text-red-500 mb-4">⚠️ Lỗi Ứng Dụng</h1>
          <p className="text-zinc-400 mb-6 max-w-md">Đã xảy ra lỗi nghiêm trọng hoặc trạng thái truyện bị hỏng. Hãy thử đặt lại màn hình làm việc để thoát khỏi trang trắng.</p>
          <code className="bg-black/50 p-4 rounded-xl text-xs text-red-300 font-mono text-left mb-8 max-w-lg overflow-auto">
            {this.state.errorMsg}
          </code>
          <button 
            onClick={this.handleReset}
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-full font-bold transition-colors"
          >
            Quay Về Thư Viện Truyện
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
