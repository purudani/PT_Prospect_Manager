import { createContext, useContext, useState, useEffect, useMemo } from 'react';

const ProspectsContext = createContext();

export function ProspectsProvider({ children }) {
  const [prospects, setProspects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [filters, setFilters] = useState({
    state: '',
    cities: [], // Changed to array for multiple selection
    zipCode: '',
    yearsRanges: [] // Changed to array for multiple ranges
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  // Load prospects data
  useEffect(() => {
    async function loadProspects() {
      try {
        const response = await fetch('/prospects.json');
        if (!response.ok) throw new Error('Failed to load prospects data');
        const data = await response.json();
        setProspects(data);
        setLoading(false);
      } catch (err) {
        setError(err.message);
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

    // Apply search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(p =>
        p.fullName.toLowerCase().includes(query) ||
        p.email.toLowerCase().includes(query) ||
        p.licenseNo.toLowerCase().includes(query) ||
        p.city.toLowerCase().includes(query)
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
    const allIds = new Set(filteredProspects.map(p => p.id));
    setSelectedIds(allIds);
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
    clearSelection,
    toggleSelectAll
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
