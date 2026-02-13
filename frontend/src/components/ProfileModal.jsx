import { useState, useEffect } from 'react';
import { useProspects } from '../context/ProspectsContext';

export default function ProfileModal({ prospect, onClose }) {
  const { selectedIds, toggleSelection, updateProspect, deleteProspect } = useProspects();
  const [blocking, setBlocking] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [currentProspect, setCurrentProspect] = useState(prospect);
  
  // Update local state when prospect prop changes
  useEffect(() => {
    setCurrentProspect(prospect);
  }, [prospect]);
  
  if (!prospect) return null;

  const isSelected = selectedIds.has(prospect.id);

  const handleToggleBlock = async () => {
    setBlocking(true);
    try {
      const updatedData = await updateProspect(currentProspect.licenseNumber, {
        blocked: !currentProspect.blocked
      });
      // Update local state immediately for real-time UI update
      setCurrentProspect(prev => ({
        ...prev,
        blocked: !prev.blocked
      }));
    } catch (error) {
      console.error('Failed to toggle block status:', error);
      alert('Failed to update block status. Please try again.');
    } finally {
      setBlocking(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteProspect(currentProspect.licenseNumber);
      // Close modal after successful deletion
      onClose();
    } catch (error) {
      console.error('Failed to delete prospect:', error);
      alert('Failed to delete prospect. Please try again.');
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {currentProspect.fullName}
              {currentProspect.nameSuffix && `, ${currentProspect.nameSuffix}`}
            </h2>
            {currentProspect.blocked && (
              <span className="inline-flex items-center gap-1 mt-1 px-2 py-1 text-xs font-semibold bg-red-100 text-red-700 rounded-full">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                </svg>
                Blocked from receiving emails
              </span>
            )}
            {currentProspect.email_sent && (
              <span className="inline-flex items-center gap-1 mt-1 ml-2 px-2 py-1 text-xs font-semibold bg-green-100 text-green-700 rounded-full">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Email sent {new Date(currentProspect.email_sent).toLocaleDateString()}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Personal Information */}
          <section>
            <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Personal Information
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <label className="text-gray-500 font-medium">First Name</label>
                <p className="text-gray-900">{prospect.firstName || '-'}</p>
              </div>
              {prospect.middleName && (
                <div>
                  <label className="text-gray-500 font-medium">Middle Name</label>
                  <p className="text-gray-900">{prospect.middleName}</p>
                </div>
              )}
              <div>
                <label className="text-gray-500 font-medium">Last Name</label>
                <p className="text-gray-900">{prospect.lastName || '-'}</p>
              </div>
              {prospect.nameSuffix && (
                <div>
                  <label className="text-gray-500 font-medium">Suffix</label>
                  <p className="text-gray-900">{prospect.nameSuffix}</p>
                </div>
              )}
            </div>
          </section>

          {/* Contact Information */}
          <section>
            <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Contact Information
            </h3>
            <div className="space-y-2 text-sm">
              {prospect.email ? (
                <div>
                  <label className="text-gray-500 font-medium">Email</label>
                  <a 
                    href={`mailto:${prospect.email}`}
                    className="text-blue-600 hover:text-blue-800 underline block"
                  >
                    {prospect.email}
                  </a>
                </div>
              ) : (
                <div>
                  <label className="text-gray-500 font-medium">Email</label>
                  <p className="text-gray-400 italic">No email on file</p>
                </div>
              )}
            </div>
          </section>

          {/* Address */}
          <section>
            <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Address
            </h3>
            <div className="text-sm space-y-1">
              {prospect.addressLine1 && <p className="text-gray-900">{prospect.addressLine1}</p>}
              {prospect.addressLine2 && <p className="text-gray-900">{prospect.addressLine2}</p>}
              <p className="text-gray-900">
                {prospect.city && `${prospect.city}, `}
                {prospect.state && `${prospect.state} `}
                {prospect.zipCode}
              </p>
              {prospect.county && (
                <p className="text-gray-600">{prospect.county} County</p>
              )}
            </div>
          </section>

          {/* License Details */}
          <section>
            <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              License Details
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <label className="text-gray-500 font-medium">License Number</label>
                <p className="text-gray-900 font-mono">{prospect.licenseNo || '-'}</p>
              </div>
              <div>
                <label className="text-gray-500 font-medium">Status</label>
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                  prospect.licenseStatus === 'Active' 
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {prospect.licenseStatus}
                </span>
              </div>
              <div>
                <label className="text-gray-500 font-medium">Profession</label>
                <p className="text-gray-900">{prospect.professionName || '-'}</p>
              </div>
              <div>
                <label className="text-gray-500 font-medium">License Type</label>
                <p className="text-gray-900">{prospect.licenseType || '-'}</p>
              </div>
              <div>
                <label className="text-gray-500 font-medium">Issue Date</label>
                <p className="text-gray-900">{prospect.issueDate || '-'}</p>
              </div>
              <div>
                <label className="text-gray-500 font-medium">Expiration Date</label>
                <p className="text-gray-900">{prospect.expirationDate || '-'}</p>
              </div>
              {prospect.yearsSinceLicense !== null && (
                <div>
                  <label className="text-gray-500 font-medium">Years Since Issue</label>
                  <p className="text-gray-900">{prospect.yearsSinceLicense} years</p>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Footer Actions */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="flex gap-3">
            <button
              onClick={() => toggleSelection(prospect.id)}
              className={`px-6 py-2 rounded-md font-medium transition-colors ${
                isSelected
                  ? 'bg-red-600 text-white hover:bg-red-700'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {isSelected ? 'Remove from Selection' : 'Add to Selection'}
            </button>
            <button
              onClick={handleToggleBlock}
              disabled={blocking}
              className={`px-6 py-2 rounded-md font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                currentProspect.blocked
                  ? 'bg-green-600 text-white hover:bg-green-700'
                  : 'bg-orange-600 text-white hover:bg-orange-700'
              }`}
            >
              {blocking ? 'Updating...' : (currentProspect.blocked ? 'Unblock' : 'Block')}
            </button>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              disabled={deleting}
              className="px-6 py-2 bg-red-600 text-white rounded-md font-medium hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Delete
            </button>
          </div>
          <button
            onClick={onClose}
            className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 font-medium hover:bg-gray-100 transition-colors"
          >
            Close
          </button>
        </div>

        {/* Delete Confirmation Dialog */}
        {showDeleteConfirm && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-10 rounded-lg">
            <div className="bg-white rounded-lg shadow-xl p-6 max-w-md mx-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex-shrink-0 w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Delete Prospect</h3>
                  <p className="text-sm text-gray-600">This action cannot be undone</p>
                </div>
              </div>
              
              <p className="text-gray-700 mb-6">
                Are you sure you want to permanently delete <strong>{currentProspect.fullName}</strong>? 
                This will remove them from the database and Excel file.
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
                  onClick={handleDelete}
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
    </div>
  );
}
