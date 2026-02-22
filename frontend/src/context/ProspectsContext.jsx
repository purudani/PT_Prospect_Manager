/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { API_BASE_URL } from '../config/api';

const ProspectsContext = createContext();

function normalizeLicenseNumber(value) {
  if (value === null || value === undefined) return '';
  return String(value).trim();
}

export function ProspectsProvider({ children }) {
  const [prospects, setProspects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [filters, setFilters] = useState({
    state: '',
    cities: [], // Changed to array for multiple selection
    zipCode: '',
    yearsRanges: [], // Changed to array for multiple ranges
    emailSent: '',
    blocked: '',
    clicked: ''
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  // Load prospects data
  useEffect(() => {
    async function loadProspects() {
      try {
        const response = await fetch(`${API_BASE_URL}/api/prospects`);
        if (!response.ok) throw new Error('Failed to load prospects data from API');

        const result = await response.json();
        if (!result.success || !Array.isArray(result.data)) {
          throw new Error('Invalid prospects response format');
        }

        setProspects(result.data);
      } catch (err) {
        try {
          // Fallback to static file when backend is unavailable
          const fallbackResponse = await fetch('/prospects.json');
          if (!fallbackResponse.ok) throw new Error('Failed to load prospects fallback data');
          const fallbackData = await fallbackResponse.json();
          setProspects(fallbackData);
          setError(`Live sync unavailable: ${err.message}. Using fallback data.`);
        } catch (fallbackErr) {
          setError(fallbackErr.message);
        }
      } finally {
        setLoading(false);
      }
    }
    loadProspects();
  }, []);

  // Filter and search prospects
  const filteredProspects = useMemo(() => {
    let filtered = [...prospects];

    // Apply filters
    if (filters.state) {
      filtered = filtered.filter(p => p.state === filters.state);
    }
    if (filters.cities && filters.cities.length > 0) {
      filtered = filtered.filter(p => 
        filters.cities.includes(p.city)
      );
    }
    if (filters.zipCode) {
      filtered = filtered.filter(p => 
        p.zipCode.includes(filters.zipCode)
      );
    }
    if (filters.yearsRanges && filters.yearsRanges.length > 0) {
      filtered = filtered.filter(p => {
        if (p.yearsSinceLicense === null) return false;
        return filters.yearsRanges.some(range => 
          p.yearsSinceLicense >= range.min && p.yearsSinceLicense <= range.max
        );
      });
    }
    if (filters.emailSent) {
      filtered = filtered.filter(p => {
        const hasEmailSent = Boolean(p.email_sent);
        return filters.emailSent === 'sent' ? hasEmailSent : !hasEmailSent;
      });
    }
    if (filters.blocked) {
      filtered = filtered.filter(p => {
        const isBlocked = Boolean(p.blocked);
        return filters.blocked === 'blocked' ? isBlocked : !isBlocked;
      });
    }
    if (filters.clicked) {
      filtered = filtered.filter(p => {
        const hasClicked = Boolean(p.clicked);
        return filters.clicked === 'clicked' ? hasClicked : !hasClicked;
      });
    }

    // Apply search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(p =>
        (p.fullName || '').toLowerCase().includes(query) ||
        (p.email || '').toLowerCase().includes(query) ||
        (p.licenseNo || '').toLowerCase().includes(query) ||
        (p.city || '').toLowerCase().includes(query)
      );
    }

    // Apply sorting
    if (sortConfig.key) {
      filtered.sort((a, b) => {
        const aVal = a[sortConfig.key];
        const bVal = b[sortConfig.key];
        
        if (aVal === null || aVal === '') return 1;
        if (bVal === null || bVal === '') return -1;
        
        if (typeof aVal === 'string') {
          return sortConfig.direction === 'asc'
            ? aVal.localeCompare(bVal)
            : bVal.localeCompare(aVal);
        }
        
        return sortConfig.direction === 'asc'
          ? aVal - bVal
          : bVal - aVal;
      });
    }

    return filtered;
  }, [prospects, filters, searchQuery, sortConfig]);

  // Get unique values for filters
  const uniqueStates = useMemo(() => {
    const states = [...new Set(prospects.map(p => p.state))].filter(Boolean);
    return states.sort();
  }, [prospects]);

  const uniqueCities = useMemo(() => {
    let cities = prospects;
    if (filters.state) {
      cities = cities.filter(p => p.state === filters.state);
    }
    return [...new Set(cities.map(p => p.city))].filter(Boolean).sort();
  }, [prospects, filters.state]);

  // Selection handlers
  const toggleSelection = (id) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  const selectAll = () => {
    setSelectedIds(prevSelected => {
      const newSet = new Set(prevSelected);
      filteredProspects.forEach(p => newSet.add(p.id));
      return newSet;
    });
  };

  const selectByIds = (ids) => {
    setSelectedIds(prevSelected => {
      const newSet = new Set(prevSelected);
      ids.forEach(id => newSet.add(id));
      return newSet;
    });
  };

  const clearByIds = (ids) => {
    setSelectedIds(prevSelected => {
      const newSet = new Set(prevSelected);
      ids.forEach(id => newSet.delete(id));
      return newSet;
    });
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredProspects.length && filteredProspects.length > 0) {
      clearSelection();
    } else {
      selectAll();
    }
  };

  // Get selected prospects with email
  const selectedProspects = useMemo(() => {
    return prospects.filter(p => selectedIds.has(p.id) && p.email);
  }, [prospects, selectedIds]);

  // Update prospect (for email_sent, blocked flags)
  const updateProspect = async (licenseNumber, updates) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/prospects/${licenseNumber}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update prospect');
      }

      const result = await response.json();
      
      // Update local state
      setProspects(prevProspects => 
        prevProspects.map(p => 
          p.licenseNumber === licenseNumber 
            ? { ...p, ...updates }
            : p
        )
      );

      return result.data;
    } catch (error) {
      console.error('Error updating prospect:', error);
      throw error;
    }
  };

  // Add new prospect
  const addProspect = async (prospectData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/prospects`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(prospectData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to add prospect');
      }

      const result = await response.json();
      
      // Add to local state
      setProspects(prevProspects => [...prevProspects, result.data]);

      return result.data;
    } catch (error) {
      console.error('Error adding prospect:', error);
      throw error;
    }
  };

  // Delete single prospect
  const deleteProspect = async (licenseNumber) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/prospects/${licenseNumber}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete prospect');
      }

      const result = await response.json();
      
      // Remove from local state
      setProspects(prevProspects => 
        prevProspects.filter(p => p.licenseNumber !== licenseNumber)
      );

      // Remove from selection if selected
      setSelectedIds(prevSelected => {
        const newSet = new Set(prevSelected);
        // Find the prospect's id and remove it
        const prospect = prospects.find(p => p.licenseNumber === licenseNumber);
        if (prospect) {
          newSet.delete(prospect.id);
        }
        return newSet;
      });

      return result;
    } catch (error) {
      console.error('Error deleting prospect:', error);
      throw error;
    }
  };

  // Bulk delete prospects
  const bulkDeleteProspects = async (licenseNumbers) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/prospects/bulk-delete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ licenseNumbers }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete prospects');
      }

      const result = await response.json();
      
      // Remove from local state
      const deletedSet = new Set(licenseNumbers);
      setProspects(prevProspects => 
        prevProspects.filter(p => !deletedSet.has(p.licenseNumber))
      );

      // Clear selection
      clearSelection();

      return result;
    } catch (error) {
      console.error('Error bulk deleting prospects:', error);
      throw error;
    }
  };

  // Bulk update blocked flag
  const bulkUpdateBlockedStatus = async (licenseNumbers, blocked) => {
    try {
      const normalizedLicenseNumbers = licenseNumbers.map(normalizeLicenseNumber);

      const response = await fetch(`${API_BASE_URL}/api/prospects/bulk-update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ licenseNumbers: normalizedLicenseNumbers, blocked }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to bulk update blocked status');
      }

      const result = await response.json();
      const targetSet = new Set(normalizedLicenseNumbers);

      setProspects(prevProspects =>
        prevProspects.map(p =>
          targetSet.has(normalizeLicenseNumber(p.licenseNumber))
            ? { ...p, blocked }
            : p
        )
      );

      return result;
    } catch (error) {
      console.error('Error bulk updating blocked status:', error);
      throw error;
    }
  };

  const value = {
    prospects,
    filteredProspects,
    loading,
    error,
    selectedIds,
    selectedProspects,
    filters,
    setFilters,
    searchQuery,
    setSearchQuery,
    sortConfig,
    setSortConfig,
    uniqueStates,
    uniqueCities,
    toggleSelection,
    selectAll,
    selectByIds,
    clearByIds,
    clearSelection,
    toggleSelectAll,
    updateProspect,
    addProspect,
    deleteProspect,
    bulkDeleteProspects,
    bulkUpdateBlockedStatus
  };

  return (
    <ProspectsContext.Provider value={value}>
      {children}
    </ProspectsContext.Provider>
  );
}

export function useProspects() {
  const context = useContext(ProspectsContext);
  if (!context) {
    throw new Error('useProspects must be used within ProspectsProvider');
  }
  return context;
}
