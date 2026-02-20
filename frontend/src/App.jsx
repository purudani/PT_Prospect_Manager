import { useState } from 'react';
import { useProspects } from './context/ProspectsContext';
import FilterPanel from './components/FilterPanel';
import ProspectsTable from './components/ProspectsTable';
import ProfileModal from './components/ProfileModal';
import EmailComposer from './components/EmailComposer';
import AddProspectModal from './components/AddProspectModal';
import Notification from './components/Notification';
import LoadingSpinner from './components/LoadingSpinner';
import { exportToExcel, exportSelectedToExcel } from './utils/exportHelpers';

function App() {
  const { prospects, filteredProspects, selectedIds, loading, error, bulkDeleteProspects, bulkUpdateBlockedStatus } = useProspects();
  const [selectedProspect, setSelectedProspect] = useState(null);
  const [showEmailComposer, setShowEmailComposer] = useState(false);
  const [showAddProspect, setShowAddProspect] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [bulkUpdatingBlockStatus, setBulkUpdatingBlockStatus] = useState(false);
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

  const handleBulkDelete = async () => {
    setDeleting(true);
    try {
      // Get license numbers of selected prospects
      const selectedProspects = prospects.filter(p => selectedIds.has(p.id));
      const licenseNumbers = selectedProspects.map(p => p.licenseNumber);
      
      const result = await bulkDeleteProspects(licenseNumbers);
      
      setNotification({
        type: 'success',
        message: `Successfully deleted ${result.deleted} prospect(s)`
      });
      setTimeout(() => setNotification(null), 5000);
      setShowDeleteConfirm(false);
    } catch (error) {
      setNotification({
        type: 'error',
        message: `Delete failed: ${error.message}`
      });
      setTimeout(() => setNotification(null), 5000);
    } finally {
      setDeleting(false);
    }
  };

  const handleBulkBlockedStatus = async (blocked) => {
    setBulkUpdatingBlockStatus(true);
    try {
      const selectedProspects = prospects.filter(p => selectedIds.has(p.id));
      const licenseNumbers = selectedProspects.map(p => p.licenseNumber);

      const result = await bulkUpdateBlockedStatus(licenseNumbers, blocked);

      setNotification({
        type: 'success',
        message: `Successfully ${blocked ? 'blocked' : 'unblocked'} ${result.updated} prospect(s)`
      });
      setTimeout(() => setNotification(null), 5000);
    } catch (error) {
      setNotification({
        type: 'error',
        message: `Bulk ${blocked ? 'block' : 'unblock'} failed: ${error.message}`
      });
      setTimeout(() => setNotification(null), 5000);
    } finally {
      setBulkUpdatingBlockStatus(false);
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
                  onClick={() => setShowAddProspect(true)}
                  className="px-4 py-2 bg-purple-600 text-white rounded-md font-medium hover:bg-purple-700 transition-colors flex items-center gap-2 text-sm"
                  title="Add a new prospect manually"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add Prospect
                </button>
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

      {/* Bottom Bar - Action Buttons */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg">
          <div className="w-full px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {selectedIds.size} prospect{selectedIds.size !== 1 ? 's' : ''} selected
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="px-6 py-2 bg-red-600 text-white rounded-md font-medium hover:bg-red-700 transition-colors flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Delete Selected
                </button>
                <button
                  onClick={() => handleBulkBlockedStatus(true)}
                  disabled={bulkUpdatingBlockStatus}
                  className="px-6 py-2 bg-orange-600 text-white rounded-md font-medium hover:bg-orange-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-1.414-1.414L12 9.172 7.05 4.222 5.636 5.636 10.586 10.586 5.636 15.536 7.05 16.95 12 12 16.95 16.95 18.364 15.536 13.414 10.586z" />
                  </svg>
                  {bulkUpdatingBlockStatus ? 'Updating...' : 'Block Selected'}
                </button>
                <button
                  onClick={() => handleBulkBlockedStatus(false)}
                  disabled={bulkUpdatingBlockStatus}
                  className="px-6 py-2 bg-emerald-600 text-white rounded-md font-medium hover:bg-emerald-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {bulkUpdatingBlockStatus ? 'Updating...' : 'Unblock Selected'}
                </button>
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

      {showAddProspect && (
        <AddProspectModal
          isOpen={showAddProspect}
          onClose={() => setShowAddProspect(false)}
        />
      )}

      {/* Bulk Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-shrink-0 w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Delete Selected Prospects</h3>
                <p className="text-sm text-gray-600">This action cannot be undone</p>
              </div>
            </div>
            
            <p className="text-gray-700 mb-6">
              Are you sure you want to permanently delete <strong>{selectedIds.size} prospect{selectedIds.size !== 1 ? 's' : ''}</strong>? 
              {' '}This will remove them from the database and Excel file.
            </p>
            
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleting}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkDelete}
                disabled={deleting}
                className="px-4 py-2 bg-red-600 text-white rounded-md font-medium hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deleting ? 'Deleting...' : 'Delete Permanently'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
