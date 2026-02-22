import { useState, useEffect, useRef } from 'react';
import { useProspects } from '../context/ProspectsContext';

export default function FilterPanel() {
  const { filters, setFilters, uniqueStates, uniqueCities } = useProspects();
  const [showCitiesDropdown, setShowCitiesDropdown] = useState(false);
  const [showYearsDropdown, setShowYearsDropdown] = useState(false);
  const [citySearch, setCitySearch] = useState('');
  
  const citiesRef = useRef(null);
  const yearsRef = useRef(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (citiesRef.current && !citiesRef.current.contains(event.target)) {
        setShowCitiesDropdown(false);
      }
      if (yearsRef.current && !yearsRef.current.contains(event.target)) {
        setShowYearsDropdown(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleStateChange = (e) => {
    setFilters({ ...filters, state: e.target.value, cities: [] });
  };

  const toggleCity = (city) => {
    const newCities = filters.cities.includes(city)
      ? filters.cities.filter(c => c !== city)
      : [...filters.cities, city];
    setFilters({ ...filters, cities: newCities });
  };

  const handleZipChange = (e) => {
    setFilters({ ...filters, zipCode: e.target.value });
  };

  const yearsPresets = [
    { label: '0-2 years', min: 0, max: 2 },
    { label: '2-5 years', min: 2, max: 5 },
    { label: '5-10 years', min: 5, max: 10 },
    { label: '10-20 years', min: 10, max: 20 },
    { label: '20+ years', min: 20, max: 100 }
  ];

  const toggleYearsRange = (preset) => {
    const exists = filters.yearsRanges.some(
      r => r.min === preset.min && r.max === preset.max
    );
    
    const newRanges = exists
      ? filters.yearsRanges.filter(r => !(r.min === preset.min && r.max === preset.max))
      : [...filters.yearsRanges, { min: preset.min, max: preset.max }];
    
    setFilters({ ...filters, yearsRanges: newRanges });
  };

  const isYearsRangeSelected = (preset) => {
    return filters.yearsRanges.some(
      r => r.min === preset.min && r.max === preset.max
    );
  };

  const clearFilters = () => {
    setFilters({
      state: '',
      cities: [],
      zipCode: '',
      yearsRanges: [],
      emailSent: '',
      blocked: '',
      clicked: ''
    });
    setCitySearch('');
  };

  const activeFilterCount = 
    (filters.state ? 1 : 0) +
    (filters.cities.length > 0 ? 1 : 0) +
    (filters.zipCode ? 1 : 0) +
    (filters.yearsRanges.length > 0 ? 1 : 0) +
    (filters.emailSent ? 1 : 0) +
    (filters.blocked ? 1 : 0) +
    (filters.clicked ? 1 : 0);

  // Filter cities based on search
  const filteredCities = uniqueCities.filter(city =>
    city.toLowerCase().includes(citySearch.toLowerCase())
  );

  return (
    <div className="bg-white shadow-md rounded-lg p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-800">Filters</h2>
        {activeFilterCount > 0 && (
          <span className="bg-blue-500 text-white text-xs font-semibold px-2.5 py-1 rounded-full">
            {activeFilterCount}
          </span>
        )}
      </div>

      {/* State Filter */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          State
        </label>
        <select
          value={filters.state}
          onChange={handleStateChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">All States</option>
          {uniqueStates.map(state => (
            <option key={state} value={state}>{state}</option>
          ))}
        </select>
      </div>

      {/* Cities Filter - Multi-select */}
      <div className="relative" ref={citiesRef}>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Cities {filters.cities.length > 0 && (
            <span className="text-blue-600 text-xs">({filters.cities.length} selected)</span>
          )}
        </label>
        <button
          onClick={() => setShowCitiesDropdown(!showCitiesDropdown)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-left flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <span className="text-gray-700">
            {filters.cities.length === 0 
              ? 'Select cities...'
              : `${filters.cities.length} ${filters.cities.length === 1 ? 'city' : 'cities'} selected`
            }
          </span>
          <svg className={`w-5 h-5 text-gray-400 transition-transform ${showCitiesDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        
        {showCitiesDropdown && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-64 overflow-hidden flex flex-col">
            {/* Search input */}
            <div className="p-2 border-b border-gray-200">
              <input
                type="text"
                value={citySearch}
                onChange={(e) => setCitySearch(e.target.value)}
                placeholder="Search cities..."
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
            
            {/* Cities list */}
            <div className="overflow-y-auto flex-1">
              {filteredCities.length === 0 ? (
                <div className="px-3 py-2 text-sm text-gray-500 text-center">
                  No cities found
                </div>
              ) : (
                filteredCities.slice(0, 100).map(city => (
                  <label
                    key={city}
                    className="flex items-center px-3 py-2 hover:bg-gray-100 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={filters.cities.includes(city)}
                      onChange={() => toggleCity(city)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mr-2"
                    />
                    <span className="text-sm text-gray-700">{city}</span>
                  </label>
                ))
              )}
            </div>
            
            {/* Footer with clear button */}
            {filters.cities.length > 0 && (
              <div className="p-2 border-t border-gray-200 flex justify-between items-center bg-gray-50">
                <span className="text-xs text-gray-600">
                  {filters.cities.length} selected
                </span>
                <button
                  onClick={() => setFilters({ ...filters, cities: [] })}
                  className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                >
                  Clear all
                </button>
              </div>
            )}
          </div>
        )}
        
        {/* Selected cities tags */}
        {filters.cities.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {filters.cities.slice(0, 3).map(city => (
              <span
                key={city}
                className="inline-flex items-center px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded"
              >
                {city}
                <button
                  onClick={() => toggleCity(city)}
                  className="ml-1 hover:text-blue-900"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </span>
            ))}
            {filters.cities.length > 3 && (
              <span className="inline-flex items-center px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                +{filters.cities.length - 3} more
              </span>
            )}
          </div>
        )}
      </div>

      {/* Zip Code Filter */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Zip Code
        </label>
        <input
          type="text"
          value={filters.zipCode}
          onChange={handleZipChange}
          placeholder="Enter zip code..."
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Email Sent Filter */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Email Sent
        </label>
        <select
          value={filters.emailSent}
          onChange={(e) => setFilters({ ...filters, emailSent: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">All</option>
          <option value="sent">Sent</option>
          <option value="not_sent">Not Sent</option>
        </select>
      </div>

      {/* Blocked Filter */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Blocked
        </label>
        <select
          value={filters.blocked}
          onChange={(e) => setFilters({ ...filters, blocked: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">All</option>
          <option value="blocked">Blocked</option>
          <option value="not_blocked">Not Blocked</option>
        </select>
      </div>

      {/* Clicked Filter */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Clicked
        </label>
        <select
          value={filters.clicked}
          onChange={(e) => setFilters({ ...filters, clicked: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">All</option>
          <option value="clicked">Clicked</option>
          <option value="not_clicked">Not Clicked</option>
        </select>
      </div>

      {/* Years Since License Filter - Multi-select */}
      <div className="relative" ref={yearsRef}>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Years Since License {filters.yearsRanges.length > 0 && (
            <span className="text-blue-600 text-xs">({filters.yearsRanges.length} selected)</span>
          )}
        </label>
        <button
          onClick={() => setShowYearsDropdown(!showYearsDropdown)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-left flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <span className="text-gray-700">
            {filters.yearsRanges.length === 0
              ? 'All Years'
              : `${filters.yearsRanges.length} ${filters.yearsRanges.length === 1 ? 'range' : 'ranges'} selected`
            }
          </span>
          <svg className={`w-5 h-5 text-gray-400 transition-transform ${showYearsDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        
        {showYearsDropdown && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
            {yearsPresets.map(preset => (
              <label
                key={preset.label}
                className="flex items-center px-3 py-2 hover:bg-gray-100 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={isYearsRangeSelected(preset)}
                  onChange={() => toggleYearsRange(preset)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mr-2"
                />
                <span className="text-sm text-gray-700">{preset.label}</span>
              </label>
            ))}
            
            {filters.yearsRanges.length > 0 && (
              <div className="p-2 border-t border-gray-200 bg-gray-50">
                <button
                  onClick={() => setFilters({ ...filters, yearsRanges: [] })}
                  className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                >
                  Clear all
                </button>
              </div>
            )}
          </div>
        )}
        
        {/* Selected year ranges tags */}
        {filters.yearsRanges.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {filters.yearsRanges.map((range, idx) => {
              const preset = yearsPresets.find(p => p.min === range.min && p.max === range.max);
              return (
                <span
                  key={idx}
                  className="inline-flex items-center px-2 py-1 text-xs bg-green-100 text-green-800 rounded"
                >
                  {preset?.label || `${range.min}-${range.max} years`}
                  <button
                    onClick={() => toggleYearsRange(range)}
                    className="ml-1 hover:text-green-900"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </span>
              );
            })}
          </div>
        )}
      </div>

      {/* Clear Filters Button */}
      {activeFilterCount > 0 && (
        <button
          onClick={clearFilters}
          className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors font-medium"
        >
          Clear All Filters
        </button>
      )}
    </div>
  );
}
