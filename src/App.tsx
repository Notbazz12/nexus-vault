import React, { useEffect } from 'react';
import { useVaultStore } from './store/useVaultStore';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';

// 13 Views
import { WelcomeView } from './views/WelcomeView';
import { CreateMasterView } from './views/CreateMasterView';
import { UnlockView } from './views/UnlockView';
import { DashboardView } from './views/DashboardView';
import { PasswordsView } from './views/PasswordsView';
import { EditItemView } from './views/EditItemView';
import { GeneratorView } from './views/GeneratorView';
import { NotesView } from './views/NotesView';
import { CardsView } from './views/CardsView';
import { SecurityCenterView } from './views/SecurityCenterView';
import { ImportExportView } from './views/ImportExportView';
import { SettingsView } from './views/SettingsView';
import { BackupsView } from './views/BackupsView';

export const App: React.FC = () => {
  const { vaultStatus, activeView, setView, lockVault, setEditingItem } = useVaultStore();

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl + L: Lock Vault
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'l') {
        e.preventDefault();
        lockVault();
      }
      // Ctrl + G: Generator
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'g') {
        e.preventDefault();
        setView('generator');
      }
      // Ctrl + N: New Item
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        setEditingItem({
          id: 'item-' + Math.random().toString(36).substring(2, 9),
          type: 'login',
          title: '',
          username: '',
          email: '',
          password: '',
          url: '',
          notes: '',
          category: 'General',
          folderId: null,
          isFavorite: false,
          isTrashed: false,
          tags: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          customFields: [],
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lockVault, setView, setEditingItem]);

  // Route to onboarding or lock views when appropriate
  if (activeView === 'welcome' || vaultStatus === 'uninitialized') {
    return <WelcomeView />;
  }

  if (activeView === 'create-master') {
    return <CreateMasterView />;
  }

  if (activeView === 'unlock' || vaultStatus === 'locked') {
    return <UnlockView />;
  }

  // Main Desktop Application Shell
  return (
    <div className="flex h-screen w-screen bg-nexus-950 text-nexus-100 overflow-hidden font-sans">
      {/* Permanent Left Sidebar Navigation */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Top Header & Search */}
        <Header />

        {/* Dynamic Context View */}
        <main className="flex-1 flex overflow-hidden">
          {activeView === 'dashboard' && <DashboardView />}
          {activeView === 'passwords' && <PasswordsView />}
          {activeView === 'edit-item' && <EditItemView />}
          {activeView === 'generator' && <GeneratorView />}
          {activeView === 'notes' && <NotesView />}
          {activeView === 'cards' && <CardsView />}
          {activeView === 'security-center' && <SecurityCenterView />}
          {activeView === 'import-export' && <ImportExportView />}
          {activeView === 'settings' && <SettingsView />}
          {activeView === 'backups' && <BackupsView />}
        </main>
      </div>
    </div>
  );
};

export default App;
