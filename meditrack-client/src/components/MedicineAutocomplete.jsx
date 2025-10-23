// src/components/MedicineAutocomplete.jsx
import React, { useState, useEffect } from 'react';
import { Autocomplete, TextField, CircularProgress } from '@mui/material';
import api from '../api/client';

export default function MedicineAutocomplete({ value, onSelect, label = 'Medicine' }) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState(''); // text in the field
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(false);

  // Keep input text in sync when parent provides a value (string name)
  useEffect(() => {
    if (typeof value === 'string') setInput(value);
    if (!value) setInput('');
  }, [value]);

  const fetchOptions = async (term) => {
    if (!term || term.length < 2) { setOptions([]); return; }
    try {
      setLoading(true);
      const { data } = await api.get(`/medicines?search=${encodeURIComponent(term)}&active=true`);
      setOptions(data.medicines || []);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Autocomplete
      size="small"
      sx={{ minWidth: 260 }}
      open={open}
      onOpen={() => setOpen(true)}
      onClose={() => setOpen(false)}
      options={options}
      getOptionLabel={(o) => o?.name || ''}
      filterOptions={(x) => x} // server-side
      inputValue={input}
      onInputChange={(_, v, reason) => {
        setInput(v);
        if (reason !== 'reset') fetchOptions(v);
      }}
      onChange={(_, v) => onSelect && onSelect(v || null)}
      isOptionEqualToValue={(o, v) => o._id === v._id}
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          InputProps={{
            ...params.InputProps,
            endAdornment: (
              <>
                {loading ? <CircularProgress color="inherit" size={16} /> : null}
                {params.InputProps.endAdornment}
              </>
            ),
          }}
        />
      )}
    />
  );
}