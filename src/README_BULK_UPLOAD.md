# Bulk Alert Upload Guide

This guide explains how to use the bulk upload feature to add multiple alerts to the system at once using a CSV file.

## Overview

The bulk upload feature allows administrators and authorized users to upload multiple travel safety alerts simultaneously. This is especially useful when:

- Setting up initial data for a new region
- Adding multiple related alerts for a major event
- Importing alerts from another system

## Accessing the Bulk Upload Page

1. Sign in to your account with administrative privileges
2. Navigate to `/bulk` in your browser
3. You'll see the bulk upload interface

## CSV File Format

Your CSV file must follow a specific format to be processed correctly. The following columns are supported:

### Required Fields

- **title**: Short, descriptive title for the alert
- **description**: Detailed description of the alert situation
- **latitude**: Latitude coordinate in decimal format (e.g., 55.953252)
- **longitude**: Longitude coordinate in decimal format (e.g., -3.188267)
- **city**: Name of the city where the alert is active

### Optional Fields

- **alertCategory**: Main category of the alert (Transport, Health, Safety, Weather, Scam, Crime, Other)
- **alertType**: Specific type of the alert (Scam, Theft, Crime, Weather, Public Disorder, Other)
- **risk**: Risk level (Low, Medium, High, Critical)
- **impact**: Description of impact on travelers
- **priority**: Priority level (Low, Medium, High)
- **targetAudience**: Target audience for this alert (e.g., Tourists, Business Travelers)
- **recommendedAction**: Recommended actions for users
- **country**: Country name
- **linkToSource**: URL link to source information
- **status**: Status of the alert (pending, approved, rejected, published) - defaults to "pending"
- **addToEmailSummary**: Include in email summaries (true/false) - defaults to false

## Steps to Upload Alerts

1. Click the "Download Template" button to get a pre-formatted CSV file
2. Open the template in a spreadsheet program (Excel, Google Sheets, etc.)
3. Fill in the data for your alerts (one row per alert)
4. Save the file as CSV format
5. Return to the bulk upload page
6. Click "Select CSV File" and choose your file
7. Click "Upload Alerts" to process your file

## Processing Time

The time required to process your file depends on the number of alerts being uploaded. For most files (less than 100 alerts), processing should complete within a few seconds.

## Error Handling

If there are any errors in your CSV file, the system will:

1. Process all valid alerts
2. Display an error summary showing which rows had issues
3. Provide detailed error messages for each problem

Common errors include:
- Missing required fields
- Invalid coordinates
- Incorrect values for category or type fields
- Malformed CSV structure

## Tips for Success

- Always use the provided template to ensure correct formatting
- Check your data for accuracy before uploading
- For geographic coordinates, ensure they are in decimal format (not degrees/minutes/seconds)
- Keep descriptions concise but informative
- Include actionable recommendations when appropriate
- If you're unsure about a field, refer to this documentation or contact support
- For large datasets, consider splitting them into multiple files

## Limitations

- Maximum file size: 5MB
- Maximum rows per file: 1000 alerts
- File format must be CSV (Comma-Separated Values)
- Special characters should be properly encoded

## Support

If you encounter any issues with the bulk upload feature, please contact support at support@tourprism.com or open a support ticket through the platform. 