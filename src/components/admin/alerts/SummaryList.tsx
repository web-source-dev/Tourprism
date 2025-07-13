import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  CircularProgress,
  Alert,
  TextField,
  InputAdornment,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { format } from 'date-fns';
import { getAllForecastSummaries } from '@/services/api';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

interface AggregatedSummary {
  date: string;
  displayDate: string;
  location: string;
  sector: string;
  totalRecipients: number;
}

export default function SummaryList() {
  const [summaries, setSummaries] = useState<AggregatedSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [fetchTrigger, setFetchTrigger] = useState(0);

  useEffect(() => {
    const fetchSummaries = async () => {
      try {
        setLoading(true);
        setError(null);
        const params: { limit: number; search?: string; startDate?: string; endDate?: string } = { limit: 100 };
        if (search) params.search = search;
        if (startDate) params.startDate = format(startDate, 'yyyy-MM-dd');
        if (endDate) params.endDate = format(endDate, 'yyyy-MM-dd');
        const response = await getAllForecastSummaries(params);
        const grouped: Record<string, AggregatedSummary> = {};
        response.summaries.forEach((summary) => {
          const dateKey = format(new Date(summary.sentAt), 'yyyy-MM-dd');
          const displayDate = format(new Date(summary.sentAt), 'EEEE, MMMM d, yyyy');
          const location = summary.location || 'Unknown';
          const sector = summary.sector || 'Unknown';
          const key = `${dateKey}|${location}|${sector}`;
          if (!grouped[key]) {
            grouped[key] = {
              date: dateKey,
              displayDate,
              location,
              sector,
              totalRecipients: 0
            };
          }
          grouped[key].totalRecipients += summary.recipientCount;
        });
        const aggregated = Object.values(grouped).sort((a, b) => b.date.localeCompare(a.date));
        setSummaries(aggregated);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch summaries');
      } finally {
        setLoading(false);
      }
    };
    fetchSummaries();
  }, [fetchTrigger]);

  // Handlers for search and date filters
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
  };
  const handleFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFetchTrigger(f => f + 1);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box>
        {/* Filters */}
        <Box
          component="form"
          onSubmit={handleFilterSubmit}
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            gap: 1.5,
            mb: 2,
            alignItems: 'stretch',
            width: '100%',
            mx: { xs: 'auto', md: 0 },
          }}
        >
          <TextField
            placeholder="Search..."
            value={search}
            onChange={handleSearchChange}
            size="medium"
            variant="outlined"
            sx={{
              width: '100%',
              borderRadius: 4,
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
              },
              background: '#fff',
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              gap: 1.5,
              width: '100%',
            }}
          >
            <DatePicker
              label="Start Date"
              value={startDate}
              onChange={setStartDate}
              slotProps={{
                textField: {
                  variant: 'outlined',
                  placeholder: 'Start Date',
                  sx: {
                    width: '100%',
                    borderRadius: 2,
                    background: '#fff',
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                    },
                  },
                  InputProps: {
                    style: { borderRadius: 8 },
                  },
                },
              }}
              format="yyyy-MM-dd"
            />
            <DatePicker
              label="End Date"
              value={endDate}
              onChange={setEndDate}
              slotProps={{
                textField: {
                  variant: 'outlined',
                  placeholder: 'End Date',
                  sx: {
                    width: '100%',
                    borderRadius: 2,
                    background: '#fff',
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                    },
                  },
                  InputProps: {
                    style: { borderRadius: 8 }
                  },
                },
              }}
              format="yyyy-MM-dd"
            />
          </Box>
          <Box sx={{ display: 'none' }}>
            {/* Hidden submit button for Enter key accessibility */}
            <button type="submit" tabIndex={-1} />
          </Box>
        </Box>

        {/* List */}
        <Box
          sx={{
            display: 'flex',
            p: 0,
            flexDirection: { xs: 'column', md: 'row' },
            flexWrap: { xs: 'nowrap', md: 'wrap' },
            gap: { xs: 0, md: 2 },
            width: '100%',
          }}
        >
          {summaries.map((summary, idx) => (
            <Paper
              key={summary.date + summary.location + summary.sector + idx}
              elevation={0}
              sx={{
                border: '1.5px solid #222',
                p: 2,
                minHeight: 90,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                boxShadow: 'none',
                background: '#fff',
                width: { xs: '100%', md: '32%' },
                mb: { xs: 0, md: 2 },
                mr: { xs: 0, md: 0 },
                borderBottom: { xs: '1.5px solid #222', md: '1.5px solid #222' },
                borderTop: { xs: idx === 0 ? '1.5px solid #222' : 'none', md: '1.5px solid #222' },
                borderLeft: '1.5px solid #222',
                borderRight: '1.5px solid #222',
                // Remove border radius and attach boxes on mobile
                borderBottomLeftRadius: { xs: idx === summaries.length - 1 ? 8 : 0, md: 8 },
                borderBottomRightRadius: { xs: idx === summaries.length - 1 ? 8 : 0, md: 8 },
                borderTopLeftRadius: { xs: idx === 0 ? 8 : 0, md: 8 },
                borderTopRightRadius: { xs: idx === 0 ? 8 : 0, md: 8 },
              }}
            >
              <Typography variant="subtitle1" fontWeight={500} sx={{ mb: 0.5 }}>
                {summary.displayDate}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                {summary.location} &middot; {summary.sector}
              </Typography>
              <Typography variant="body1" fontWeight={500}>
                {summary.totalRecipients.toLocaleString()} recipients
              </Typography>
            </Paper>
          ))}
        </Box>
      </Box>
    </LocalizationProvider>
  );
} 