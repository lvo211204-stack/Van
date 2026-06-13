
import React, { useState } from 'react';
import { StoryProvider, useStory } from './context/StoryContext';
import { MainWorkspace } from './components/MainWorkspace';
import { CreateWizard } from './components/CreateWizard';
import { StoryLibrary } from './components/StoryLibrary';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Toaster } from 'react-hot-toast';

const AppContent: React.FC = () => {
    const { story } = useStory();
    const [createMode, setCreateMode] = useState<'original' | 'fanfic' | null>(null);

    // If story exists, show Workspace. Otherwise check createMode.
    if (story) {
        return <MainWorkspace />;
    }

    if (createMode) {
        return <CreateWizard mode={createMode} onCancel={() => setCreateMode(null)} />;
    }

    return <StoryLibrary onCreateNew={(type) => setCreateMode(type)} />;
};

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <Toaster position="bottom-right" toastOptions={{ style: { background: '#18181b', color: '#fff', border: '1px solid #3f3f46', fontSize: '13px' } }} />
      <StoryProvider>
        <AppContent />
      </StoryProvider>
    </ErrorBoundary>
  );
};

export default App;
