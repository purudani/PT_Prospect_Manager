import { useProspects } from '../context/ProspectsContext';

export default function ProfileModal({ prospect, onClose }) {
  const { selectedIds, toggleSelection } = useProspects();
  
  if (!prospect) return null;

  const isSelected = selectedIds.has(prospect.id);

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
          <h2 className="text-2xl font-bold text-gray-900">
            {prospect.fullName}
            {prospect.nameSuffix && `, ${prospect.nameSuffix}`}
          </h2>
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
            onClick={onClose}
            className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 font-medium hover:bg-gray-100 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
