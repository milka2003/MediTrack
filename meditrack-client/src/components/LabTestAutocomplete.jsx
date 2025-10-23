// src/components/LabTestAutocomplete.jsx
import React, { useEffect, useState } from 'react';
import { Autocomplete, TextField, CircularProgress } from '@mui/material';
import api from '../api/client';

export default function LabTestAutocomplete({ value, onSelect, label = 'Lab Test', departmentId }) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => { if (typeof value === 'string') setInput(value); if (!value) setInput(''); }, [value]);

  const fetchOptions = async (term) => {
    if (!term || term.length < 2) { setOptions([]); return; }
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.set('status','Active');
      params.set('q', term);
      if (departmentId) params.set('department', departmentId);
      const { data } = await api.get(`/lab-tests?${params.toString()}`);
      setOptions(data.tests || []);
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
      filterOptions={(x) => x}
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
          InputLabelProps={{ shrink: true }}
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