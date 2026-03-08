import React, { useState, useEffect, Fragment } from 'react';
import { Combobox, ComboboxInput, ComboboxOption, ComboboxOptions, Transition } from '@headlessui/react';
import axios from 'axios';
import { baseUrl } from '../shared';

const AutocompleteInput = ({ placeholder, value, onChange, endpoint }) => {
    const [suggestions, setSuggestions] = useState([]);
    const [loading, setLoading] = useState(false);

    const safeValue = value || '';

    useEffect(() => {
        if (!safeValue || safeValue.length < 2) {
            setSuggestions([]);
            return;
        }

        // If the current value matches a suggestion, don't fetch (saves API calls)
        if (Array.isArray(suggestions) && suggestions.includes(safeValue)) return;

        const fetchSuggestions = async () => {
            setLoading(true);
            try {
                const response = await axios.get(`${baseUrl}${endpoint}`, {
                    params: { query: safeValue }
                });
                setSuggestions(Array.isArray(response.data) ? response.data : []);
            } catch (error) {
                console.error('Error fetching suggestions:', error);
                setSuggestions([]);
            } finally {
                setLoading(false);
            }
        };

        const timeoutId = setTimeout(fetchSuggestions, 300);
        return () => clearTimeout(timeoutId);
    }, [safeValue, endpoint]);

    return (
        <div className="relative">
            <Combobox value={safeValue} onChange={(val) => onChange(val || '')} nullable>
                <div className="relative">
                    <ComboboxInput
                        className="appearance-none rounded-xl relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent sm:text-sm shadow-sm transition-all"
                        placeholder={placeholder}
                        displayValue={(val) => val || ''}
                        onChange={(event) => onChange(event.target.value || '')}
                        autoComplete="off"
                    />
                </div>
                <Transition
                    as={Fragment}
                    leave="transition ease-in duration-100"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <ComboboxOptions className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-xl bg-white py-2 text-base shadow-2xl ring-1 ring-black/5 focus:outline-none sm:text-sm">
                        {loading && (
                            <div className="px-4 py-2 text-gray-500 text-xs animate-pulse">Searching...</div>
                        )}
                        {!loading && (!suggestions || suggestions.length === 0) && safeValue.length >= 2 && (
                            <div className="relative cursor-default select-none px-4 py-2 text-gray-400 italic text-xs">
                                No exact matches found, keep typing...
                            </div>
                        )}
                        {!loading && Array.isArray(suggestions) && suggestions.map((item, index) => (
                            <ComboboxOption
                                key={`${item}-${index}`}
                                className={({ focus }) =>
                                    `relative cursor-pointer select-none py-2.5 px-4 transition-colors ${focus ? 'bg-primary text-white' : 'text-gray-900 hover:bg-teal-50'
                                    }`
                                }
                                value={item}
                            >
                                {({ selected, focus }) => (
                                    <span className={`block truncate ${selected ? 'font-bold' : 'font-normal'}`}>
                                        {item}
                                    </span>
                                )}
                            </ComboboxOption>
                        ))}
                    </ComboboxOptions>
                </Transition>
            </Combobox>
        </div>
    );
};

export default AutocompleteInput;
