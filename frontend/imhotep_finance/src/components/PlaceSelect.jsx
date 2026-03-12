import { useState, useEffect } from 'react';
import axios from 'axios';

const PlaceSelect = ({ value, onChange, required = false, className = '' }) => {
  const [search, setSearch] = useState('');
  const [placesList, setPlacesList] = useState([]);
  const [placesLoading, setPlacesLoading] = useState(false);

  useEffect(() => {
    const fetchPlaces = async () => {
      setPlacesLoading(true);
      try {
        const res = await axios.get('/api/finance-management/get-places/');
        setPlacesList(res.data.places || []);
      } catch {
        setPlacesList([]);
      }
      setPlacesLoading(false);
    };
    fetchPlaces();
  }, []);

  const filtered = placesList.filter(place =>
    place.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    if (filtered.length > 0 && value && !filtered.includes(value)) {
      onChange?.(filtered[0]);
    }
  }, [search, filtered, value, onChange]);

  return (
    <div className="flex flex-col sm:flex-row gap-2 w-full">
      <select
        className={`chef-input flex-1 w-full ${className}`}
        value={filtered.includes(value) ? value : ''}
        onChange={e => {
          const selectedValue = e.target.value;
          onChange?.(selectedValue);
          if (selectedValue) {
            setSearch('');
          }
        }}
        disabled={placesLoading || filtered.length === 0}
        required={required}
      >
        <option value="">Select place</option>
        {filtered.map(place => (
          <option key={place} value={place}>{place}</option>
        ))}
      </select>
      <input
        type="text"
        value={search || value}
        onChange={e => {
          const val = e.target.value;
          setSearch(val);
          onChange?.(val);
        }}
        className={`chef-input flex-1 w-full ${className}`}
        placeholder="Type to filter or add new"
        disabled={placesLoading}
      />
    </div>
  );
};

export default PlaceSelect;