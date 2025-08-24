'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/ui/toast';
import {
  getAutoUpdateStats,
  getAutoUpdateEligibleAlerts,
  checkAlertForUpdates,
  suppressAutoUpdates,
  enableAutoUpdates,
  triggerAutoUpdateProcess,
  AutoUpdateStats,
  AutoUpdateEligibleAlert,
  AutoUpdateFilters
} from '@/services/api';
import { 
  FiRefreshCw, 
  FiEye, 
  FiEyeOff, 
  FiClock, 
  FiAlertCircle,
  FiCheckCircle,
  FiPlay,
} from 'react-icons/fi';

export default function AutoUpdatesPage() {
  const { showToast } = useToast();
  
  const [stats, setStats] = useState<AutoUpdateStats | null>(null);
  const [alerts, setAlerts] = useState<AutoUpdateEligibleAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [filters, setFilters] = useState<AutoUpdateFilters>({
    status: 'all',
    hasUpdates: 'all',
    page: 1,
    limit: 10
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    totalPages: 1,
    totalCount: 0
  });


  const fetchStats = async () => {
    try {
      const data = await getAutoUpdateStats();
      setStats(data);
    } catch (error) {
      console.error('Failed to fetch auto-update statistics', error);
      showToast('Failed to fetch auto-update statistics', 'error');
    }
  };

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const data = await getAutoUpdateEligibleAlerts(filters);
      setAlerts(data.alerts);
      setPagination({
        page: data.pagination.page,
        limit: data.pagination.limit,
        totalPages: data.pagination.totalPages,
        totalCount: data.totalCount
      });
    } catch (error) {
      console.error('Failed to fetch alerts', error);
      showToast('Failed to fetch alerts', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    fetchAlerts();
  }, [filters]);

  const handleCheckUpdate = async (alertId: string) => {
    try {
      setProcessing(alertId);
      const result = await checkAlertForUpdates(alertId);
      
      if (result.updateCreated) {
        showToast(`Update created: ${result.reason}`, 'success');
      } else {
        showToast(`No update needed: ${result.reason}`, 'error');
      }
      
      // Refresh data
      fetchStats();
      fetchAlerts();
    } catch (error) {
      console.error('Failed to check for updates', error);
      showToast('Failed to check for updates', 'error');
    } finally {
      setProcessing(null);
    }
  };

  const handleSuppressUpdates = async (alertId: string) => {
    try {
      const reason = prompt('Enter reason for suppressing auto-updates:');
      if (!reason) return;
      
      setProcessing(alertId);
      await suppressAutoUpdates(alertId, reason);
      showToast('Auto-updates suppressed successfully', 'success');
      
      // Refresh data
      fetchStats();
      fetchAlerts();
    } catch (error) {
      console.error('Failed to suppress auto-updates', error);
      showToast('Failed to suppress auto-updates', 'error');
    } finally {
      setProcessing(null);
    }
  };

  const handleEnableUpdates = async (alertId: string) => {
    try {
      setProcessing(alertId);
      await enableAutoUpdates(alertId);
      showToast('Auto-updates enabled successfully', 'success');
      
      // Refresh data
      fetchStats();
      fetchAlerts();
    } catch (error) {
      console.error('Failed to enable auto-updates', error);
      showToast('Failed to enable auto-updates', 'error');
    } finally {
      setProcessing(null);
    }
  };

  const handleTriggerProcess = async () => {
    try {
      setProcessing('trigger');
      await triggerAutoUpdateProcess();
      showToast('Auto-update process triggered successfully', 'success');
      
      // Refresh data after a delay
      setTimeout(() => {
        fetchStats();
        fetchAlerts();
      }, 5000);
    } catch (error) {
      console.error('Failed to trigger auto-update process', error);
        showToast('Failed to trigger auto-update process', 'error');
    } finally {
      setProcessing(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (alert: AutoUpdateEligibleAlert) => {
    if (alert.autoUpdateSuppressed) {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
          <FiEyeOff className="w-3 h-3 mr-1.5" />
          Suppressed
        </span>
      );
    }
    
    if (alert.updateCount && alert.updateCount > 0) {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-50 text-green-700 border border-green-200">
          <FiCheckCircle className="w-3 h-3 mr-1.5" />
          Updated ({alert.updateCount})
        </span>
      );
    }
    
    return (
      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
        <FiClock className="w-3 h-3 mr-1.5" />
        Eligible
      </span>
    );
  };

  return (
      <div className="max-w-8xl mx-auto py-6 px-0">
        {/* Header */}
        <div className="px-4 py-6 sm:px-0">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Auto-Update System</h1>
              <p className="mt-2 text-sm text-gray-600">
                Manage automatic updates for followed alerts using AI
              </p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={handleTriggerProcess}
                disabled={processing === 'trigger'}
                className="inline-flex items-center px-4 py-2 border border-black text-sm font-medium rounded-md text-white bg-black hover:bg-gray-800 focus:outline-none disabled:opacity-50"
              >
                <FiPlay className="w-4 h-4 mr-2" />
                {processing === 'trigger' ? 'Triggering...' : 'Trigger Process'}
              </button>
              <button
                onClick={() => { fetchStats(); fetchAlerts(); }}
                className="inline-flex items-center px-4 py-2 border border-black text-sm font-medium rounded-md text-black bg-white hover:bg-gray-50 focus:outline-none"
              >
                <FiRefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </button>
            </div>
          </div>
        </div> 

        {/* Statistics */}
        {stats && (
          <div className="px-4 py-6 sm:px-0">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              <div className="bg-white overflow-hidden shadow-none border rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <FiAlertCircle className="h-6 w-6 text-gray-400" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          Eligible Alerts
                        </dt>
                        <dd className="text-lg font-medium text-gray-900">
                          {stats.totalEligibleAlerts}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow-none border rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <FiCheckCircle className="h-6 w-6 text-green-400" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          With Updates
                        </dt>
                        <dd className="text-lg font-medium text-gray-900">
                          {stats.alertsWithUpdates}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow-none border rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <FiEyeOff className="h-6 w-6 text-red-400" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          Suppressed
                        </dt>
                        <dd className="text-lg font-medium text-gray-900">
                          {stats.suppressedAlerts}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow-none border rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                                         <div className="flex-shrink-0">
                       <FiClock className="h-6 w-6 text-blue-400" />
                     </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          Recent Updates
                        </dt>
                        <dd className="text-lg font-medium text-gray-900">
                          {stats.recentUpdates}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white shadow-none border rounded-lg p-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 ">
              <div>
                <label className="block text-sm font-medium text-gray-700">Status</label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value as "all" | "suppressed" | "enabled", page: 1 })}
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 border border-black rounded-md px-2"
                >
                  <option value="all">All Status</option>
                  <option value="enabled">Auto-Update Enabled</option>
                  <option value="suppressed">Suppressed</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Update History</label>
                <select
                  value={filters.hasUpdates}
                  onChange={(e) => setFilters({ ...filters, hasUpdates: e.target.value as "all" | "true" | "false", page: 1 })}
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 border border-black rounded-md px-2"
                >
                  <option value="all">All Alerts</option>
                  <option value="true">With Updates</option>
                  <option value="false">No Updates</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Last Check</label>
                <select
                  value={filters.sortBy}
                  onChange={(e) => setFilters({ ...filters, sortBy: e.target.value, page: 1 })}
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 border border-black rounded-md px-2"
                >
                  <option value="lastAutoUpdateCheck">Last Check Time</option>
                  <option value="lastUpdateAt">Last Update Time</option>
                  <option value="updateCount">Update Count</option>
                  <option value="numberOfFollows">Followers</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Alerts Display */}
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white shadow-none border overflow-hidden sm:rounded-md">
            {loading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto"></div>
                <p className="mt-2 text-sm text-gray-500">Loading alerts...</p>
              </div>
            ) : alerts.length === 0 ? (
              <div className="p-8 text-center">
                <FiAlertCircle className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No alerts found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  No alerts match the current filters.
                </p>
              </div>
            ) : (
              <>
                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                  <h3 className="text-lg font-medium text-gray-900">
                    Alerts ({alerts.length} of {pagination.totalCount})
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Manage auto-updates for followed alerts
                  </p>
                </div>
                
                <div className="divide-y divide-gray-200">
                  {alerts.map((alert) => (
                    <div key={alert._id} className="p-6 hover:bg-gray-50 transition-colors duration-200">
                      {/* Main Alert Info */}
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          {/* Header with Status and Title */}
                          <div className="flex items-center space-x-3 mb-3">
                            <div className="flex-shrink-0">
                              {getStatusBadge(alert)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="text-lg font-semibold text-gray-900 truncate">
                                {alert.title || 'No title'}
                              </h4>
                            </div>
                          </div>
                          
                          {/* Alert Details Grid */}
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                            <div className="space-y-2">
                              <div className="flex items-center space-x-2">
                                <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Location</span>
                                <span className="text-sm text-gray-900">{alert.originCity || alert.city || 'Not specified'}</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Category</span>
                                <span className="text-sm text-gray-900">{alert.alertCategory || 'Not specified'}</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Impact</span>
                                <span className={`text-sm px-2 py-1 rounded-full text-xs font-medium ${
                                  alert.impact === 'Severe' ? 'bg-red-100 text-red-800' :
                                  alert.impact === 'Moderate' ? 'bg-yellow-100 text-yellow-800' :
                                  alert.impact === 'Minor' ? 'bg-green-100 text-green-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  {alert.impact === 'Minor' ? 'Low' :
                                   alert.impact === 'Moderate' ? 'Moderate' :
                                   alert.impact === 'Severe' ? 'High' :
                                   alert.impact || 'Not specified'}
                                </span>
                              </div>
                            </div>
                            
                            <div className="space-y-2">
                              <div className="flex items-center space-x-2">
                                <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Followers</span>
                                <span className="text-sm font-semibold text-gray-900">{alert.numberOfFollows || 0}</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Updates</span>
                                <span className="text-sm font-semibold text-gray-900">{alert.updateCount || 0}</span>
                              </div>
                              {alert.lastUpdateAt && (
                                <div className="flex items-center space-x-2">
                                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Last Update</span>
                                  <span className="text-sm text-gray-900">{formatDate(alert.lastUpdateAt)}</span>
                                </div>
                              )}
                            </div>
                            
                            <div className="space-y-2">
                              {alert.lastAutoUpdateCheck && (
                                <div className="flex items-center space-x-2">
                                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Last Check</span>
                                  <span className="text-sm text-gray-900">{formatDate(alert.lastAutoUpdateCheck)}</span>
                                </div>
                              )}
                              {alert.autoUpdateSuppressed && alert.autoUpdateSuppressedReason && (
                                <div className="flex items-start space-x-2">
                                  <span className="text-xs font-medium text-red-500 uppercase tracking-wide">Suppressed</span>
                                  <span className="text-sm text-red-600">{alert.autoUpdateSuppressedReason}</span>
                                </div>
                              )}
                              {alert.autoUpdateSuppressed && alert.autoUpdateSuppressedAt && (
                                <div className="flex items-center space-x-2">
                                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Since</span>
                                  <span className="text-sm text-gray-900">{formatDate(alert.autoUpdateSuppressedAt)}</span>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          {/* Description */}
                          {alert.description && (
                            <div className="mb-4">
                              <p className="text-sm text-gray-700 line-clamp-2">
                                {alert.description}
                              </p>
                            </div>
                          )}
                        </div>
                        
                        {/* Action Buttons */}
                        <div className="flex flex-col space-y-2 ml-4">
                          {!alert.autoUpdateSuppressed ? (
                            <>
                              <button
                                onClick={() => handleCheckUpdate(alert._id)}
                                disabled={processing === alert._id}
                                className="inline-flex items-center px-4 py-2 border border-black text-sm font-medium rounded-md text-black bg-white hover:bg-gray-50 focus:outline-none disabled:opacity-50 transition-colors duration-200"
                              >
                                <FiRefreshCw className={`w-4 h-4 mr-2 ${processing === alert._id ? 'animate-spin' : ''}`} />
                                Check Update
                              </button>
                              <button
                                onClick={() => handleSuppressUpdates(alert._id)}
                                disabled={processing === alert._id}
                                className="inline-flex items-center px-4 py-2 border border-black text-sm font-medium rounded-md text-black bg-white hover:bg-gray-50 focus:outline-none disabled:opacity-50 transition-colors duration-200"
                              >
                                <FiEyeOff className="w-4 h-4 mr-2" />
                                Suppress
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => handleEnableUpdates(alert._id)}
                              disabled={processing === alert._id}
                              className="inline-flex items-center px-4 py-2 border border-black text-sm font-medium rounded-md text-black bg-white hover:bg-gray-50 focus:outline-none disabled:opacity-50 transition-colors duration-200"
                            >
                              <FiEye className="w-4 h-4 mr-2" />
                              Enable Updates
                            </button>
                          )}
                        </div>
                      </div>
                      
                      {/* Update History */}
                      {alert.updateHistory && alert.updateHistory.length > 0 && (
                        <div className="mt-6 pt-4 border-t border-gray-200">
                          <div className="flex items-center space-x-2 mb-3">
                            <FiClock className="w-4 h-4 text-gray-400" />
                            <h5 className="text-sm font-medium text-gray-900">Update History</h5>
                            <span className="text-xs text-gray-500">({alert.updateHistory.length} updates)</span>
                          </div>
                          <div className="space-y-2">
                            {alert.updateHistory.slice(0, 3).map((update, index) => (
                              <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-md">
                                <span className={`inline-block w-3 h-3 rounded-full ${
                                  update.status === 'approved' ? 'bg-green-500' : 
                                  update.status === 'pending' ? 'bg-yellow-500' : 'bg-gray-400'
                                }`}></span>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-gray-900 truncate">
                                    {update.title}
                                  </p>
                                  <div className="flex items-center space-x-4 text-xs text-gray-500">
                                    <span className="capitalize">{update.updateSource}</span>
                                    <span>•</span>
                                    <span>{formatDate(update.createdAt)}</span>
                                    <span>•</span>
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                      update.status === 'approved' ? 'bg-green-100 text-green-800' :
                                      update.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                      'bg-gray-100 text-gray-800'
                                    }`}>
                                      {update.status}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            ))}
                            {alert.updateHistory.length > 3 && (
                              <div className="text-center py-2">
                                <span className="text-sm text-gray-500">
                                  +{alert.updateHistory.length - 3} more updates
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                
                {/* Pagination */}
                {pagination.totalPages > 1 && (
                  <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                    <div className="flex-1 flex justify-between sm:hidden">
                      <button
                        onClick={() => setFilters({ ...filters, page: Math.max(1, filters.page! - 1) })}
                        disabled={filters.page === 1}
                        className="relative inline-flex items-center px-4 py-2 border border-black text-sm font-medium rounded-md text-black bg-white hover:bg-gray-50 disabled:opacity-50"
                      >
                        Previous
                      </button>
                      <button
                        onClick={() => setFilters({ ...filters, page: Math.min(pagination.totalPages, filters.page! + 1) })}
                        disabled={filters.page === pagination.totalPages}
                        className="ml-3 relative inline-flex items-center px-4 py-2 border border-black text-sm font-medium rounded-md text-black bg-white hover:bg-gray-50 disabled:opacity-50"
                      >
                        Next
                      </button>
                    </div>
                    <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm text-gray-700">
                          Showing <span className="font-medium">{((filters.page! - 1) * filters.limit!) + 1}</span> to{' '}
                          <span className="font-medium">
                            {Math.min(filters.page! * filters.limit!, pagination.totalCount)}
                          </span>{' '}
                          of <span className="font-medium">{pagination.totalCount}</span> results
                        </p>
                      </div>
                      <div>
                        <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                          <button
                            onClick={() => setFilters({ ...filters, page: Math.max(1, filters.page! - 1) })}
                            disabled={filters.page === 1}
                            className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-black bg-white text-sm font-medium text-black hover:bg-gray-50 disabled:opacity-50"
                          >
                            Previous
                          </button>
                          <button
                            onClick={() => setFilters({ ...filters, page: Math.min(pagination.totalPages, filters.page! + 1) })}
                            disabled={filters.page === pagination.totalPages}
                            className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-black bg-white text-sm font-medium text-black hover:bg-gray-50 disabled:opacity-50"
                          >
                            Next
                          </button>
                        </nav>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
  );
}
