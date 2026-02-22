import { useEffect, useRef, useState } from 'react';
import { useProspects } from '../context/ProspectsContext';

export default function ProspectsTable({ onViewProfile }) {
  const {
    filteredProspects,
    selectedIds,
    toggleSelection,
    selectByIds,
    clearByIds,
    sortConfig,
    setSortConfig,
    searchQuery,
    setSearchQuery,
    updateProspect
  } = useProspects();

  const [currentPage, setCurrentPage] = useState(1);
  const [blockingProspect, setBlockingProspect] = useState(null);
  const selectAllRef = useRef(null);
  const itemsPerPage = 50;

  const handleToggleBlock = async (prospect, e) => {
    e.stopPropagation();
    setBlockingProspect(prospect.licenseNumber);
    
    try {
      await updateProspect(prospect.licenseNumber, {
        blocked: !prospect.blocked
      });
    } catch (error) {
      console.error('Failed to toggle block status:', error);
      alert('Failed to update block status. Please try again.');
    } finally {
      setBlockingProspect(null);
    }
  };

  const formatEmailSentDate = (timestamp) => {
    if (!timestamp) return null;
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // Pagination
  const totalPages = Math.ceil(filteredProspects.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentProspects = filteredProspects.slice(startIndex, endIndex);

  // Reset to page 1 when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filteredProspects.length]);

  // Keep current page valid when data changes
  useEffect(() => {
    if (totalPages > 0 && currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  useEffect(() => {
    if (!selectAllRef.current) return;
    const isAllPageSelected = currentProspects.length > 0 &&
      currentProspects.every(p => selectedIds.has(p.id));
    const hasSomePageSelected = currentProspects.some(p => selectedIds.has(p.id));
    selectAllRef.current.indeterminate = hasSomePageSelected && !isAllPageSelected;
  }, [currentProspects, selectedIds]);

  const isAllPageSelected = currentProspects.length > 0 &&
    currentProspects.every(p => selectedIds.has(p.id));

  const handleToggleCurrentPage = () => {
    const currentPageIds = currentProspects.map(p => p.id);
    if (isAllPageSelected) {
      clearByIds(currentPageIds);
    } else {
      selectByIds(currentPageIds);
    }
  };

  const handleSort = (key) => {
    setSortConfig({
      key,
      direction: sortConfig.key === key && sortConfig.direction === 'asc' ? 'desc' : 'asc'
    });
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) {
      return (
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      );
    }
    return sortConfig.direction === 'asc' ? (
      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
      </svg>
    ) : (
      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    );
  };

  return (
    <div className="bg-white shadow-md rounded-lg overflow-hidden w-full">
      {/* Search Bar */}
      <div className="p-4 border-b border-gray-200">
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, email, license number, or city..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <svg className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {/* Results Count */}
      <div className="px-4 py-2 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
        <span className="text-sm text-gray-600">
          {filteredProspects.length === 0
            ? 'Showing 0 of 0 prospects'
            : `Showing ${startIndex + 1}-${Math.min(endIndex, filteredProspects.length)} of ${filteredProspects.length} prospects`
          }
        </span>
        {selectedIds.size > 0 && (
          <span className="text-sm font-medium text-blue-600">
            {selectedIds.size} selected
          </span>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left">
                <input
                  ref={selectAllRef}
                  type="checkbox"
                  checked={isAllPageSelected}
                  onChange={handleToggleCurrentPage}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  title="Select all prospects on this page"
                />
              </th>
              <th 
                onClick={() => handleSort('fullName')}
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              >
                <div className="flex items-center gap-2">
                  Name
                  {getSortIcon('fullName')}
                </div>
              </th>
              <th 
                onClick={() => handleSort('city')}
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              >
                <div className="flex items-center gap-2">
                  City
                  {getSortIcon('city')}
                </div>
              </th>
              <th 
                onClick={() => handleSort('state')}
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              >
                <div className="flex items-center gap-2">
                  State
                  {getSortIcon('state')}
                </div>
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Email
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Address
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                License #
              </th>
              <th 
                onClick={() => handleSort('yearsSinceLicense')}
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              >
                <div className="flex items-center gap-2">
                  Years Licensed
                  {getSortIcon('yearsSinceLicense')}
                </div>
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Email Sent
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Clicked
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {currentProspects.length === 0 ? (
              <tr>
                <td colSpan="12" className="px-4 py-8 text-center text-gray-500">
                  No prospects match your filters
                </td>
              </tr>
            ) : (
              currentProspects.map((prospect) => (
                <tr
                  key={prospect.id}
                  className={`hover:bg-gray-50 cursor-pointer transition-colors ${
                    prospect.blocked ? 'bg-red-50 opacity-75' : ''
                  }`}
                  onClick={(e) => {
                    if (e.target.type !== 'checkbox') {
                      onViewProfile(prospect);
                    }
                  }}
                >
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(prospect.id)}
                      onChange={() => toggleSelection(prospect.id)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                    {prospect.fullName}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {prospect.city}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {prospect.state}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {prospect.email ? (
                      <a 
                        href={`mailto:${prospect.email}`}
                        className="text-blue-600 hover:text-blue-800 hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {prospect.email}
                      </a>
                    ) : (
                      <span className="text-gray-400 italic">No email</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    <div className="max-w-xs truncate" title={`${prospect.addressLine1}${prospect.addressLine2 ? ', ' + prospect.addressLine2 : ''}, ${prospect.city}, ${prospect.state} ${prospect.zipCode}`}>
                      {prospect.addressLine1 ? (
                        <>
                          {prospect.addressLine1}
                          {prospect.city && `, ${prospect.city}`}
                        </>
                      ) : (
                        <span className="text-gray-400 italic">No address</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 font-mono">
                    {prospect.licenseNo}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {prospect.yearsSinceLicense !== null ? `${prospect.yearsSinceLicense} yrs` : '-'}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      prospect.licenseStatus === 'Active' 
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {prospect.licenseStatus}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {prospect.email_sent ? (
                      <div className="flex items-center gap-1">
                        <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="text-xs" title={new Date(prospect.email_sent).toLocaleString()}>
                          {formatEmailSentDate(prospect.email_sent)}
                        </span>
                      </div>
                    ) : (
                      <span className="text-gray-400 text-xs">Not sent</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      prospect.clicked
                        ? 'bg-indigo-100 text-indigo-700'
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {prospect.clicked ? 'Clicked' : 'Not clicked'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={(e) => handleToggleBlock(prospect, e)}
                      disabled={blockingProspect === prospect.licenseNumber}
                      className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                        prospect.blocked
                          ? 'bg-red-100 text-red-700 hover:bg-red-200'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                      title={prospect.blocked ? 'Click to unblock' : 'Click to block sending emails'}
                    >
                      {blockingProspect === prospect.licenseNumber ? '...' : (prospect.blocked ? 'Blocked' : 'Block')}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
          <button
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          
          <div className="flex items-center gap-2">
            {Array.from({ length: Math.min(7, totalPages) }, (_, i) => {
              let pageNum;
              if (totalPages <= 7) {
                pageNum = i + 1;
              } else if (currentPage <= 4) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 3) {
                pageNum = totalPages - 6 + i;
              } else {
                pageNum = currentPage - 3 + i;
              }
              
              return (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`px-3 py-1 rounded-md text-sm font-medium ${
                    currentPage === pageNum
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>
          
          <button
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
