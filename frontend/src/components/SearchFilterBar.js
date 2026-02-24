import React, { useState } from 'react';
import {
    ChevronDownIcon,
    FunnelIcon,
    XMarkIcon,
    MapPinIcon,
    BanknotesIcon,
    AcademicCapIcon,
    BuildingLibraryIcon
} from '@heroicons/react/24/outline';

const SearchFilterBar = ({ onFilterChange, activeFilters }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    const states = [
        "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA",
        "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD",
        "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ",
        "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC",
        "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY"
    ];

    const handleSelectChange = (e) => {
        const { name, value } = e.target;
        if (name === 'selectivity') {
            if (value === 'competitive') {
                onFilterChange('min_admission', '');
                onFilterChange('max_admission', '0.25');
            } else if (value === 'moderate') {
                onFilterChange('min_admission', '0.25');
                onFilterChange('max_admission', '0.60');
            } else if (value === 'accessible') {
                onFilterChange('min_admission', '0.60');
                onFilterChange('max_admission', '1.0');
            } else {
                onFilterChange('min_admission', '');
                onFilterChange('max_admission', '');
            }
        } else {
            onFilterChange(name, value);
        }
    };

    const clearFilters = () => {
        onFilterChange('clear', null);
    };

    const hasActiveFilters = Object.values(activeFilters).some(val => val !== '' && val !== null && val !== false);

    return (
        <div className="max-w-7xl mx-auto px-8 mt-4">
            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-4 transition-all duration-300">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setIsExpanded(!isExpanded)}
                            className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all text-sm font-bold border border-white/5"
                        >
                            <FunnelIcon className="w-4 h-4 text-teal-400" />
                            Filters
                            <ChevronDownIcon className={`w-4 h-4 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                        </button>

                        {/* Summary of active filters */}
                        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar max-w-md">
                            {activeFilters.query && (
                                <span className="flex items-center gap-1.5 px-3 py-1 bg-white/20 text-white rounded-lg text-xs font-bold whitespace-nowrap border border-white/10">
                                    Search: "{activeFilters.query}"
                                    <XMarkIcon className="w-3 h-3 cursor-pointer" onClick={() => onFilterChange('query', '')} />
                                </span>
                            )}
                            {activeFilters.state && (
                                <span className="flex items-center gap-1.5 px-3 py-1 bg-teal-500/20 text-teal-300 rounded-lg text-xs font-bold whitespace-nowrap border border-teal-500/30">
                                    {activeFilters.state}
                                    <XMarkIcon className="w-3 h-3 cursor-pointer" onClick={() => onFilterChange('state', '')} />
                                </span>
                            )}
                            {activeFilters.control && (
                                <span className="flex items-center gap-1.5 px-3 py-1 bg-purple-500/20 text-purple-300 rounded-lg text-xs font-bold whitespace-nowrap border border-purple-500/30">
                                    {activeFilters.control === '1' ? 'Public' : 'Private'}
                                    <XMarkIcon className="w-3 h-3 cursor-pointer" onClick={() => onFilterChange('control', '')} />
                                </span>
                            )}
                            {activeFilters.max_cost && (
                                <span className="flex items-center gap-1.5 px-3 py-1 bg-amber-500/20 text-amber-300 rounded-lg text-xs font-bold whitespace-nowrap border border-amber-500/30">
                                    Max ${activeFilters.max_cost}
                                    <XMarkIcon className="w-3 h-3 cursor-pointer" onClick={() => onFilterChange('max_cost', '')} />
                                </span>
                            )}
                            {(activeFilters.max_admission || activeFilters.min_admission) && (
                                <span className="flex items-center gap-1.5 px-3 py-1 bg-blue-500/20 text-blue-300 rounded-lg text-xs font-bold whitespace-nowrap border border-blue-500/30">
                                    {activeFilters.max_admission === '0.25' ? 'Competitive' : activeFilters.max_admission === '0.60' ? 'Moderate' : 'Accessible'}
                                    <XMarkIcon className="w-3 h-3 cursor-pointer" onClick={() => { onFilterChange('min_admission', ''); onFilterChange('max_admission', ''); }} />
                                </span>
                            )}
                        </div>
                    </div>

                    {hasActiveFilters && (
                        <button
                            onClick={clearFilters}
                            className="text-white/50 hover:text-white text-xs font-bold uppercase tracking-wider transition-colors"
                        >
                            Clear All
                        </button>
                    )}
                </div>

                {isExpanded && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-6 pt-6 border-t border-white/10 animate-fadeIn">
                        {/* State Filter */}
                        <div className="space-y-2">
                            <label className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">
                                <MapPinIcon className="w-3 h-3" />
                                Location (State)
                            </label>
                            <select
                                name="state"
                                value={activeFilters.state || ''}
                                onChange={handleSelectChange}
                                className="w-full bg-white/5 border border-white/10 text-white rounded-xl px-4 py-2.5 outline-none focus:border-teal-500/50 transition-all text-sm appearance-none cursor-pointer"
                            >
                                <option value="" className="bg-gray-900 text-white">All States</option>
                                {states.map((s) => (
                                    <option key={s} value={s} className="bg-gray-900 text-white">{s}</option>
                                ))}
                            </select>
                        </div>

                        {/* Cost Filter */}
                        <div className="space-y-2">
                            <label className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">
                                <BanknotesIcon className="w-3 h-3" />
                                Max Annual Cost
                            </label>
                            <select
                                name="max_cost"
                                value={activeFilters.max_cost || ''}
                                onChange={handleSelectChange}
                                className="w-full bg-white/5 border border-white/10 text-white rounded-xl px-4 py-2.5 outline-none focus:border-teal-500/50 transition-all text-sm appearance-none cursor-pointer"
                            >
                                <option value="" className="bg-gray-900 text-white">Any Price</option>
                                <option value="20000" className="bg-gray-900 text-white">Under $20k</option>
                                <option value="40000" className="bg-gray-900 text-white">Under $40k</option>
                                <option value="60000" className="bg-gray-900 text-white">Under $60k</option>
                            </select>
                        </div>

                        {/* Admission Rate Filter */}
                        <div className="space-y-2">
                            <label className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">
                                <AcademicCapIcon className="w-3 h-3" />
                                Selectivity
                            </label>
                            <select
                                name="selectivity"
                                value={activeFilters.max_admission === '0.25' ? 'competitive' : activeFilters.max_admission === '0.60' ? 'moderate' : activeFilters.min_admission === '0.60' ? 'accessible' : ''}
                                onChange={handleSelectChange}
                                className="w-full bg-white/5 border border-white/10 text-white rounded-xl px-4 py-2.5 outline-none focus:border-teal-500/50 transition-all text-sm appearance-none cursor-pointer"
                            >
                                <option value="" className="bg-gray-900 text-white">All Rates</option>
                                <option value="competitive" className="bg-gray-900 text-white">Highly Competitive (&lt;25%)</option>
                                <option value="moderate" className="bg-gray-900 text-white">Moderate (25-60%)</option>
                                <option value="accessible" className="bg-gray-900 text-white">Accessible (&gt;60%)</option>
                            </select>
                        </div>

                        {/* Type Filter */}
                        <div className="space-y-2">
                            <label className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">
                                <BuildingLibraryIcon className="w-3 h-3" />
                                Institution Type
                            </label>
                            <select
                                name="control"
                                value={activeFilters.control || ''}
                                onChange={handleSelectChange}
                                className="w-full bg-white/5 border border-white/10 text-white rounded-xl px-4 py-2.5 outline-none focus:border-teal-500/50 transition-all text-sm appearance-none cursor-pointer"
                            >
                                <option value="" className="bg-gray-900 text-white">Any Type</option>
                                <option value="1" className="bg-gray-900 text-white">Public</option>
                                <option value="2" className="bg-gray-900 text-white">Private</option>
                            </select>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SearchFilterBar;
