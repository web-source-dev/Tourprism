import React, { useEffect, useRef, useState } from 'react';
import { 
  FormControl, 
  TextField, 
  Paper, 
  MenuItem,
  ClickAwayListener
} from '@mui/material';
import { LocationOn as LocationIcon } from '@mui/icons-material';
import usePlacesAutocomplete, { getGeocode, getLatLng } from 'use-places-autocomplete';

interface LocationSearchInputProps {
  value: {
    city?: string;
    country?: string;
    latitude?: number;
    longitude?: number;
    placeId?: string;
  } | null;
  setValue: (location: {
    city: string;
    country: string;
    latitude: number;
    longitude: number;
    placeId: string;
  }) => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
}

const LocationSearchInput: React.FC<LocationSearchInputProps> = ({ 
  setValue, 
  value, 
  label = "Location",
  placeholder = "Search for a city...",
  required = false,
  disabled = false
}) => {
  const {
    ready,
    value: inputValue,
    suggestions: { status, data },
    setValue: setInputValue,
    clearSuggestions,
  } = usePlacesAutocomplete({
    callbackName: "initMap",
    debounce: 300,
    requestOptions: {
      // Limit the results to cities
      types: ['(cities)']
    }
  });

  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (value?.city) {
      setInputValue(value.city);
    }
  }, [value, setInputValue]);

  const handleSelect = async (description: string) => {
    setInputValue(description, false);
    clearSuggestions();
    setIsOpen(false);

    try {
      const results = await getGeocode({ address: description });
      const { lat, lng } = await getLatLng(results[0]);
      const cityName = results[0].address_components.find(
        component => component.types.includes('locality')
      )?.long_name || description;

      const countryName = results[0].address_components.find(
        component => component.types.includes('country')
      )?.long_name || '';

      setValue({
        city: cityName,
        country: countryName,
        latitude: lat,
        longitude: lng,
        placeId: results[0].place_id,
      });
    } catch (error) {
      console.error('Error selecting location:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    if (e.target.value) {
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  };

  const handleClickAway = () => {
    setIsOpen(false);
    clearSuggestions();
  };

  return (
    <ClickAwayListener onClickAway={handleClickAway}>
      <FormControl fullWidth ref={inputRef}>
        <TextField
          label={label}
          value={inputValue}
          onChange={handleInputChange}
          onClick={() => inputValue && setIsOpen(true)}
          disabled={!ready || disabled}
          fullWidth
          placeholder={placeholder}
          required={required}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: 2,
            }
          }}
          InputProps={{
            endAdornment: <LocationIcon color="action" />,
          }}
        />
        {isOpen && status === 'OK' && (
          <Paper 
            elevation={1} 
            sx={{ 
              mt: 0.5, 
              position: 'absolute', 
              width: '100%', 
              zIndex: 1000, 
              borderRadius: 2, 
              overflow: 'hidden',
              top: '100%' // Position below the input
            }}
          >
            {data.map(({ place_id, description }) => (
              <MenuItem 
                key={place_id} 
                onClick={() => handleSelect(description)}
                sx={{ cursor: 'pointer', py: 1.5 }}
              >
                {description}
              </MenuItem>
            ))}
          </Paper>
        )}
      </FormControl>
    </ClickAwayListener>
  );
};

export default LocationSearchInput;