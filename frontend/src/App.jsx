import { useState } from 'react';
import { useProspects } from './context/ProspectsContext';
import FilterPanel from './components/FilterPanel';
import ProspectsTable from './components/ProspectsTable';
import ProfileModal from './components/ProfileModal';
import EmailComposer from './components/EmailComposer';
import Notification from './components/Notification';
import LoadingSpinner from './components/LoadingSpinner';
import { exportToExcel, exportSelectedToExcel } from './utils/exportHelpers';

function App() {
  const { prospects, filteredProspects, selectedIds, loading, error } = useProspects();
  const [selectedProspect, setSelectedProspect] = useState(null);
  const [showEmailComposer, setShowEmailComposer] = useState(false);
  const [notification, setNotification] = useState(null);

  const handleSendSuccess = (result) => {
    setNotification({
      type: 'success',
      message: `Successfully sent ${result.sent} email${result.sent !== 1 ? 's' : ''}${result.failed > 0 ? `, ${result.failed} failed` : ''}`
    });
    setTimeout(() => setNotification(null), 5000);
  };

  const handleExportFiltered = () => {
    try {
      const filename = exportToExcel(filteredProspects, 'filtered_prospects');
      setNotification({
        type: 'success',
        message: `Exported ${filteredProspects.length} prospects to ${filename}`
      });
      setTimeout(() => setNotification(null), 5000);
    } catch (error) {
      setNotification({
        type: 'error',
        message: `Export failed: ${error.message}`
      });
      setTimeout(() => setNotification(null), 5000);
    }
  };

  const handleExportSelected = () => {
    try {
      const filename = exportSelectedToExcel(prospects, selectedIds, 'selected_prospects');
      setNotification({
        type: 'success',
        message: `Exported ${selectedIds.size} selected prospects to ${filename}`
      });
      setTimeout(() => setNotification(null), 5000);
    } catch (error) {
      setNotification({
        type: 'error',
        message: `Export failed: ${error.message}`
      });
      setTimeout(() => setNotification(null), 5000);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="xl" className="mx-auto" />
          <p className="mt-4 text-gray-600">Loading prospects...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-md p-6 max-w-md w-full">
          <div className="flex items-center gap-3 text-red-600 mb-3">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h2 className="text-xl font-bold">Error</h2>
          </div>
          <p className="text-gray-700">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">PT Prospect Manager</h1>
              <p className="text-sm text-gray-600 mt-1">
                {prospects.length.toLocaleString()} total prospects
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-sm text-gray-600">
                  Filtered: <span className="font-semibold text-gray-900">{filteredProspects.length.toLocaleString()}</span>
                </div>
                {selectedIds.size > 0 && (
                  <div className="text-sm text-blue-600 font-medium">
                    {selectedIds.size} selected
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleExportFiltered}
                  disabled={filteredProspects.length === 0}
                  className="px-4 py-2 bg-green-600 text-white rounded-md font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm"
                  title="Export filtered results to Excel"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Export Filtered
                </button>
                {selectedIds.size > 0 && (
                  <button
                    onClick={handleExportSelected}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 transition-colors flex items-center gap-2 text-sm"
                    title="Export selected prospects to Excel"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Export Selected
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Notification */}
      {notification && (
        <div className="fixed top-4 right-4 z-50">
          <Notification
            type={notification.type}
            message={notification.message}
            onClose={() => setNotification(null)}
          />
        </div>
      )}

      {/* Main Content */}
      <main className="w-full px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex gap-6">
          {/* Sidebar - Filters */}
          <aside className="w-72 flex-shrink-0">
            <div className="sticky top-6">
              <FilterPanel />
            </div>
          </aside>

          {/* Main Content - Table */}
          <div className="flex-1 min-w-0 overflow-x-auto">
            <ProspectsTable onViewProfile={setSelectedProspect} />
          </div>
        </div>
      </main>

      {/* Bottom Bar - Send Email Button */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg">
          <div className="w-full px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {selectedIds.size} prospect{selectedIds.size !== 1 ? 's' : ''} selected
                </p>
              </div>
              <button
                onClick={() => setShowEmailComposer(true)}
                className="px-6 py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Send Email
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      {selectedProspect && (
        <ProfileModal
          prospect={selectedProspect}
          onClose={() => setSelectedProspect(null)}
        />
      )}

      {showEmailComposer && (
        <EmailComposer
          onClose={() => setShowEmailComposer(false)}
          onSendSuccess={handleSendSuccess}
        />
      )}
    </div>
  );
}

export default App;
