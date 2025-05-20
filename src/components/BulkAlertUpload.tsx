'use client';

import React, { useState, ChangeEvent } from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  Paper, 
  Alert, 
  CircularProgress, 
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  Chip
} from '@mui/material';
import { uploadBulkAlerts, downloadTemplate } from '../services/bulkApi';

interface UploadResult {
  totalProcessed: number;
  successCount: number;
  errorCount: number;
  errors: { row: number; errors: string[] }[];
}

const BulkAlertUpload = () => {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expandedAccordion, setExpandedAccordion] = useState<string | false>('panel1');

  const handleAccordionChange = (panel: string) => (event: React.SyntheticEvent, isExpanded: boolean) => {
    setExpandedAccordion(isExpanded ? panel : false);
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile && selectedFile.type === 'text/csv') {
      setFile(selectedFile);
      setError(null);
    } else {
      setFile(null);
      setError('Please select a valid CSV file');
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file first');
      return;
    }

    setIsUploading(true);
    setError(null);
    setUploadResult(null);

    try {
      const result = await uploadBulkAlerts(file);
      setUploadResult(result as UploadResult);
    } catch (err) {
      setError(typeof err === 'string' ? err : 'Failed to upload file');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      await downloadTemplate();
    } catch (err) {
      console.error('Error downloading template:', err);
      setError('Failed to download template');
    }
  };

  // Sample data for field descriptions
  const fieldDescriptions = [
    { field: 'alertCategory', description: 'Main category of the alert (Weather, Transport, Civil Unrest, General Safety, Natural Disaster)', required: true },
    { field: 'alertType', description: 'Specific type of the alert (Rain, Strike, Protest, Cyber Attack, Fire, Fog, Data Breach, Storm, Flood)', required: true },
    { field: 'title', description: 'Short, descriptive title for the alert', required: true },
    { field: 'description', description: 'Detailed description of the alert situation', required: true },
    { field: 'risk', description: 'Risk level (Low, Medium, High, Critical)', required: true },
    { field: 'impact', description: 'Description of impact on travelers', required: true },
    { field: 'priority', description: 'Priority level (Low, Medium, High)', required: true },
    { field: 'targetAudience', description: 'Target audience for this alert (e.g., Tourists, Business Travelers)', required: true },
    { field: 'recommendedAction', description: 'Recommended actions for users', required: true },
    { field: 'latitude', description: 'Latitude coordinate (decimal format)', required: true },
    { field: 'longitude', description: 'Longitude coordinate (decimal format)', required: true },
    { field: 'city', description: 'City name', required: true },
    { field: 'country', description: 'Country name', required: true },
    { field: 'expectedStart', description: 'Expected start date/time of the alert (ISO format: YYYY-MM-DDTHH:MM:SS.sssZ)', required: true },
    { field: 'expectedEnd', description: 'Expected end date/time of the alert (ISO format: YYYY-MM-DDTHH:MM:SS.sssZ)', required: true },
    { field: 'linkToSource', description: 'URL link to source information', required: true },
    { field: 'status', description: 'Status (pending, approved, rejected, published)', required: true },
    { field: 'addToEmailSummary', description: 'Include in email summaries (true/false)', required: true }
  ];

  return (
    <Paper elevation={3} sx={{ p: 3, maxWidth: 800, mx: 'auto', mt: 4 }}>
      <Typography variant="h5" sx={{ mb: 3, fontWeight: 'bold' }}>
        Bulk Upload Alerts
      </Typography>

      <Typography variant="body1" sx={{ mb: 3 }}>
        Use this tool to upload multiple travel safety alerts at once using a CSV file. 
        Download our template to see the expected format.
      </Typography>

      <Accordion 
        expanded={expandedAccordion === 'panel1'} 
        onChange={handleAccordionChange('panel1')}
        sx={{ mb: 2 }}
      >
        <AccordionSummary 
          expandIcon={<i className="ri-arrow-down-s-line" />}
          aria-controls="panel1a-content"
          id="panel1a-header"
        >
          <Typography variant="subtitle1" fontWeight="medium">CSV Format Requirements</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography paragraph>
            Your CSV file should include the following columns. Fields marked with (*) are required.
          </Typography>
          <List dense>
            {fieldDescriptions.map((field, index) => (
              <ListItem key={index} sx={{ py: 0.5 }}>
                <ListItemText 
                  primary={
                    <Box component="span" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {field.field}
                      {field.required && <Chip size="small" label="Required" color="primary" sx={{ height: 20 }} />}
                    </Box>
                  }
                  secondary={field.description} 
                />
              </ListItem>
            ))}
          </List>
        </AccordionDetails>
      </Accordion>

      <Box sx={{ mb: 4, display: 'flex', gap: 2, alignItems: 'center' }}>
        <Button
          variant="outlined"
          onClick={handleDownloadTemplate}
          startIcon={<i className="ri-download-line" />}
          sx={{
            borderRadius: 2,
            borderColor: '#ccc',
            color: '#444',
            textTransform: 'none',
            py: 1.2
          }}
        >
          Download Template
        </Button>
        <Typography variant="body2" color="text.secondary">
          Use our pre-formatted template for best results
        </Typography>
      </Box>

      <Divider sx={{ my: 3 }} />

      <Typography variant="h6" sx={{ mb: 2 }}>
        Upload CSV File
      </Typography>

      <Box sx={{ mb: 3 }}>
        <input
          accept=".csv"
          style={{ display: 'none' }}
          id="csv-file-input"
          type="file"
          onChange={handleFileChange}
        />
        <label htmlFor="csv-file-input">
          <Button
            component="span"
            variant="contained"
            startIcon={<i className="ri-file-upload-line" />}
            sx={{
              bgcolor: 'black',
              '&:hover': { bgcolor: '#333' },
              borderRadius: 2,
              textTransform: 'none',
              py: 1.2
            }}
          >
            Select CSV File
          </Button>
        </label>
        {file && (
          <Box sx={{ display: 'flex', alignItems: 'center', mt: 2, p: 1.5, bgcolor: '#f5f5f5', borderRadius: 1 }}>
            <i className="ri-file-list-line" style={{ fontSize: 20, marginRight: 8 }} />
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              Selected: {file.name} ({(file.size / 1024).toFixed(1)} KB)
            </Typography>
          </Box>
        )}
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Button
        variant="contained"
        onClick={handleUpload}
        disabled={!file || isUploading}
        startIcon={isUploading ? <CircularProgress size={20} sx={{ color: 'white' }} /> : <i className="ri-upload-cloud-line" />}
        sx={{
          bgcolor: 'black',
          '&:hover': { bgcolor: '#333' },
          borderRadius: 2,
          textTransform: 'none',
          width: '100%',
          py: 1.5
        }}
      >
        {isUploading ? 'Uploading...' : 'Upload Alerts'}
      </Button>

      {uploadResult && (
        <Box sx={{ mt: 3 }}>
          <Alert 
            severity={uploadResult.errorCount > 0 ? 'warning' : 'success'}
            icon={uploadResult.errorCount > 0 ? <i className="ri-error-warning-line" /> : <i className="ri-checkbox-circle-line" />}
          >
            <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
              Upload Summary
            </Typography>
            <Typography variant="body2">
              Processed {uploadResult.totalProcessed} alerts
              <br />
              Successfully uploaded: {uploadResult.successCount}
              <br />
              Errors: {uploadResult.errorCount}
            </Typography>
          </Alert>
          {uploadResult.errorCount > 0 && (
            <Accordion sx={{ mt: 2 }}>
              <AccordionSummary expandIcon={<i className="ri-arrow-down-s-line" />}>
                <Typography variant="subtitle2" color="error">
                  Error Details ({uploadResult.errorCount})
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Box sx={{ maxHeight: 300, overflowY: 'auto' }}>
                  {uploadResult.errors.map((error, index) => (
                    <Alert key={index} severity="error" sx={{ mb: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                        Row {error.row}:
                      </Typography>
                      <ul style={{ margin: '4px 0', paddingLeft: 20 }}>
                        {error.errors.map((err, i) => (
                          <li key={i}>{err}</li>
                        ))}
                      </ul>
                    </Alert>
                  ))}
                </Box>
              </AccordionDetails>
            </Accordion>
          )}
        </Box>
      )}
    </Paper>
  );
};

export default BulkAlertUpload; 