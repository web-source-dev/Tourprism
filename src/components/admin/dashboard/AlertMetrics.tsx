'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Pagination,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert as MuiAlert,
  CircularProgress,
  Tabs,
  Tab
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  Remove,
  Visibility,
  Favorite,
  Analytics,
  Archive,
  Publish
} from '@mui/icons-material';
import { getAlertPerformanceMetrics, getTopPerformers, type AlertMetrics, type AlertMetricsSummary } from '../../../services/api';

interface AlertMetricsProps {
  refreshTrigger?: number;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`alert-tabpanel-${index}`}
      aria-labelledby={`alert-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `alert-tab-${index}`,
    'aria-controls': `alert-tabpanel-${index}`,
  };
}

const AlertMetrics: React.FC<AlertMetricsProps> = ({ refreshTrigger }) => {
  const [tabValue, setTabValue] = useState(0);
  const [publishedMetrics, setPublishedMetrics] = useState<AlertMetrics[]>([]);
  const [archivedMetrics, setArchivedMetrics] = useState<AlertMetrics[]>([]);
  const [publishedSummary, setPublishedSummary] = useState<AlertMetricsSummary | null>(null);
  const [archivedSummary, setArchivedSummary] = useState<AlertMetricsSummary | null>(null);
  const [topPerformers, setTopPerformers] = useState<AlertMetrics[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [sortBy, setSortBy] = useState<'performance_score' | 'total_views' | 'total_follows' | 'follow_rate' | 'created_at'>('performance_score');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [totalPages, setTotalPages] = useState(1);

  const fetchMetrics = async (status: 'published' | 'archived') => {
    try {
      setLoading(true);
      setError(null);
      
      const [metricsResponse, topPerformersResponse] = await Promise.all([
        getAlertPerformanceMetrics({
          page,
          limit,
          sortBy,
          sortOrder,
          status
        }),
        getTopPerformers({ limit: 5, metric: 'performance_score', status })
      ]);

      if (status === 'published') {
        setPublishedMetrics(metricsResponse.alerts);
        setPublishedSummary(metricsResponse.summary);
      } else {
        setArchivedMetrics(metricsResponse.alerts);
        setArchivedSummary(metricsResponse.summary);
      }
      
      setTopPerformers(topPerformersResponse.top_performers);
      setTotalPages(metricsResponse.pagination.totalPages);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch metrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const status = tabValue === 0 ? 'published' : 'archived';
    fetchMetrics(status);
  }, [page, sortBy, sortOrder, refreshTrigger, tabValue]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    setPage(1); // Reset to first page when switching tabs
  };

  const getPerformanceStatusColor = (status: string) => {
    switch (status) {
      case 'Overperforming':
        return 'success';
      case '❄ Underperforming':
        return 'error';
      default:
        return 'warning';
    }
  };

  const getPerformanceStatusIcon = (status: string) => {
    switch (status) {
      case 'Overperforming':
        return <TrendingUp fontSize="small" />;
      case '❄ Underperforming':
        return <TrendingDown fontSize="small" />;
      default:
        return <Remove fontSize="small" />;
    }
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat().format(num);
  };

  const formatPercentage = (num: number) => {
    return `${num.toFixed(2)}%`;
  };

  const currentMetrics = tabValue === 0 ? publishedMetrics : archivedMetrics;
  const currentSummary = tabValue === 0 ? publishedSummary : archivedSummary;

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <MuiAlert severity="error" sx={{ mb: 2 }}>
        {error}
      </MuiAlert>
    );
  }

  return (
    <Box>
      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="alert status tabs">
          <Tab 
            icon={<Publish />} 
            label="Published Alerts" 
            {...a11yProps(0)} 
            iconPosition="start"
          />
          <Tab 
            icon={<Archive />} 
            label="Archived Alerts" 
            {...a11yProps(1)} 
            iconPosition="start"
          />
        </Tabs>
      </Box>

      {/* Published Alerts Tab */}
      <TabPanel value={tabValue} index={0}>
        {/* Summary Cards */}
        {currentSummary && (
          <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
            <Card sx={{ flex: 1, minWidth: 200 }}>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Published Alerts
                </Typography>
                <Typography variant="h4">
                  {formatNumber(currentSummary.total_alerts)}
                </Typography>
              </CardContent>
            </Card>
            <Card sx={{ flex: 1, minWidth: 200 }}>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Total Views
                </Typography>
                <Typography variant="h4">
                  {formatNumber(currentSummary.total_views)}
                </Typography>
              </CardContent>
            </Card>
            <Card sx={{ flex: 1, minWidth: 200 }}>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Total Follows
                </Typography>
                <Typography variant="h4">
                  {formatNumber(currentSummary.total_follows)}
                </Typography>
              </CardContent>
            </Card>
            <Card sx={{ flex: 1, minWidth: 200 }}>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Avg Follow Rate
                </Typography>
                <Typography variant="h4">
                  {formatPercentage(currentSummary.avg_follow_rate)}
                </Typography>
              </CardContent>
            </Card>
          </Box>
        )}

        {/* Performance Distribution */}
        {currentSummary && (
          <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
            <Card sx={{ flex: 1, minWidth: 300 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Performance Distribution
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Chip
                    icon={<TrendingUp />}
                    label={`Overperforming: ${currentSummary.performance_distribution.overperforming}`}
                    color="success"
                    variant="outlined"
                  />
                  <Chip
                    icon={<Remove />}
                    label={`Normal: ${currentSummary.performance_distribution.normal}`}
                    color="warning"
                    variant="outlined"
                  />
                  <Chip
                    icon={<TrendingDown />}
                    label={`Underperforming: ${currentSummary.performance_distribution.underperforming}`}
                    color="error"
                    variant="outlined"
                  />
                </Box>
              </CardContent>
            </Card>
            <Card sx={{ flex: 1, minWidth: 300 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Top Performers
                </Typography>
                <Box>
                  {topPerformers.slice(0, 3).map((alert, index) => (
                    <Box key={alert._id} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Typography variant="body2" sx={{ flex: 1 }}>
                        {index + 1}. {alert.title.length > 30 ? `${alert.title.substring(0, 30)}...` : alert.title}
                      </Typography>
                      <Chip
                        size="small"
                        label={`Score: ${alert.performance_score}`}
                        color="primary"
                      />
                    </Box>
                  ))}
                </Box>
              </CardContent>
            </Card>
          </Box>
        )}

        {/* Controls */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h5">
            Published Alert Performance Metrics
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Sort By</InputLabel>
              <Select
                value={sortBy}
                label="Sort By"
                onChange={(e) => setSortBy(e.target.value as 'performance_score' | 'total_views' | 'total_follows' | 'follow_rate' | 'created_at')}
              >
                <MenuItem value="performance_score">Performance Score</MenuItem>
                <MenuItem value="total_views">Total Views</MenuItem>
                <MenuItem value="total_follows">Total Follows</MenuItem>
                <MenuItem value="follow_rate">Follow Rate</MenuItem>
                <MenuItem value="created_at">Created Date</MenuItem>
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 100 }}>
              <InputLabel>Order</InputLabel>
              <Select
                value={sortOrder}
                label="Order"
                onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
              >
                <MenuItem value="desc">Desc</MenuItem>
                <MenuItem value="asc">Asc</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </Box>

        {/* Metrics Table */}
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Alert Title</TableCell>
                <TableCell align="center">
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Visibility sx={{ mr: 1 }} />
                    Views
                  </Box>
                </TableCell>
                <TableCell align="center">
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Favorite sx={{ mr: 1 }} />
                    Follows
                  </Box>
                </TableCell>
                <TableCell align="center">Follow Rate</TableCell>
                <TableCell align="center">
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Analytics sx={{ mr: 1 }} />
                    Performance Score
                  </Box>
                </TableCell>
                <TableCell align="center">Status</TableCell>
                <TableCell align="center">Forecast</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {currentMetrics.map((alert) => (
                <TableRow key={alert._id} hover>
                  <TableCell>
                    <Typography variant="body2" sx={{ maxWidth: 200 }}>
                      {alert.title}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    {formatNumber(alert.total_views)}
                  </TableCell>
                  <TableCell align="center">
                    {formatNumber(alert.total_follows)}
                  </TableCell>
                  <TableCell align="center">
                    {formatPercentage(alert.follow_rate)}
                  </TableCell>
                  <TableCell align="center">
                    <Typography variant="body2" fontWeight="bold">
                      {alert.performance_score}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      icon={getPerformanceStatusIcon(alert.performance_status)}
                      label={alert.performance_status}
                      color={getPerformanceStatusColor(alert.performance_status) as 'success' | 'error' | 'warning'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      label={alert.pushed_to_forecast ? 'Yes' : 'No'}
                      color={alert.pushed_to_forecast ? 'success' : 'default'}
                      size="small"
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Pagination */}
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
          <Pagination
            count={totalPages}
            page={page}
            onChange={(_, newPage) => setPage(newPage)}
            color="primary"
          />
        </Box>
      </TabPanel>

      {/* Archived Alerts Tab */}
      <TabPanel value={tabValue} index={1}>
        {/* Summary Cards */}
        {currentSummary && (
          <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
            <Card sx={{ flex: 1, minWidth: 200 }}>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Archived Alerts
                </Typography>
                <Typography variant="h4">
                  {formatNumber(currentSummary.total_alerts)}
                </Typography>
              </CardContent>
            </Card>
            <Card sx={{ flex: 1, minWidth: 200 }}>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Total Views
                </Typography>
                <Typography variant="h4">
                  {formatNumber(currentSummary.total_views)}
                </Typography>
              </CardContent>
            </Card>
            <Card sx={{ flex: 1, minWidth: 200 }}>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Total Follows
                </Typography>
                <Typography variant="h4">
                  {formatNumber(currentSummary.total_follows)}
                </Typography>
              </CardContent>
            </Card>
            <Card sx={{ flex: 1, minWidth: 200 }}>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Avg Follow Rate
                </Typography>
                <Typography variant="h4">
                  {formatPercentage(currentSummary.avg_follow_rate)}
                </Typography>
              </CardContent>
            </Card>
          </Box>
        )}

        {/* Performance Distribution */}
        {currentSummary && (
          <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
            <Card sx={{ flex: 1, minWidth: 300 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Performance Distribution
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Chip
                    icon={<TrendingUp />}
                    label={`Overperforming: ${currentSummary.performance_distribution.overperforming}`}
                    color="success"
                    variant="outlined"
                  />
                  <Chip
                    icon={<Remove />}
                    label={`Normal: ${currentSummary.performance_distribution.normal}`}
                    color="warning"
                    variant="outlined"
                  />
                  <Chip
                    icon={<TrendingDown />}
                    label={`Underperforming: ${currentSummary.performance_distribution.underperforming}`}
                    color="error"
                    variant="outlined"
                  />
                </Box>
              </CardContent>
            </Card>
            <Card sx={{ flex: 1, minWidth: 300 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Top Performers
                </Typography>
                <Box>
                  {topPerformers.slice(0, 3).map((alert, index) => (
                    <Box key={alert._id} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Typography variant="body2" sx={{ flex: 1 }}>
                        {index + 1}. {alert.title.length > 30 ? `${alert.title.substring(0, 30)}...` : alert.title}
                      </Typography>
                      <Chip
                        size="small"
                        label={`Score: ${alert.performance_score}`}
                        color="primary"
                      />
                    </Box>
                  ))}
                </Box>
              </CardContent>
            </Card>
          </Box>
        )}

        {/* Controls */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h5">
            Archived Alert Performance Metrics
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Sort By</InputLabel>
              <Select
                value={sortBy}
                label="Sort By"
                onChange={(e) => setSortBy(e.target.value as 'performance_score' | 'total_views' | 'total_follows' | 'follow_rate' | 'created_at')}
              >
                <MenuItem value="performance_score">Performance Score</MenuItem>
                <MenuItem value="total_views">Total Views</MenuItem>
                <MenuItem value="total_follows">Total Follows</MenuItem>
                <MenuItem value="follow_rate">Follow Rate</MenuItem>
                <MenuItem value="created_at">Created Date</MenuItem>
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 100 }}>
              <InputLabel>Order</InputLabel>
              <Select
                value={sortOrder}
                label="Order"
                onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
              >
                <MenuItem value="desc">Desc</MenuItem>
                <MenuItem value="asc">Asc</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </Box>

        {/* Metrics Table */}
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Alert Title</TableCell>
                <TableCell align="center">
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Visibility sx={{ mr: 1 }} />
                    Views
                  </Box>
                </TableCell>
                <TableCell align="center">
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Favorite sx={{ mr: 1 }} />
                    Follows
                  </Box>
                </TableCell>
                <TableCell align="center">Follow Rate</TableCell>
                <TableCell align="center">
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Analytics sx={{ mr: 1 }} />
                    Performance Score
                  </Box>
                </TableCell>
                <TableCell align="center">Status</TableCell>
                <TableCell align="center">Forecast</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {currentMetrics.map((alert) => (
                <TableRow key={alert._id} hover>
                  <TableCell>
                    <Typography variant="body2" sx={{ maxWidth: 200 }}>
                      {alert.title}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    {formatNumber(alert.total_views)}
                  </TableCell>
                  <TableCell align="center">
                    {formatNumber(alert.total_follows)}
                  </TableCell>
                  <TableCell align="center">
                    {formatPercentage(alert.follow_rate)}
                  </TableCell>
                  <TableCell align="center">
                    <Typography variant="body2" fontWeight="bold">
                      {alert.performance_score}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      icon={getPerformanceStatusIcon(alert.performance_status)}
                      label={alert.performance_status}
                      color={getPerformanceStatusColor(alert.performance_status) as 'success' | 'error' | 'warning'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      label={alert.pushed_to_forecast ? 'Yes' : 'No'}
                      color={alert.pushed_to_forecast ? 'success' : 'default'}
                      size="small"
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Pagination */}
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
          <Pagination
            count={totalPages}
            page={page}
            onChange={(_, newPage) => setPage(newPage)}
            color="primary"
          />
        </Box>
      </TabPanel>
    </Box>
  );
};

export default AlertMetrics;
