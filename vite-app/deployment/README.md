# Web Form Application

A responsive web form application with audio feature selection, model classification options, and file upload functionality.

## Overview

This application provides a user-friendly web form with the following features:

- Feature checkboxes for BPM, Key, Approachability and Engagement (at least one must be selected)
- Classification model selection (Discogs-Effnet, Musicnn, Magnatagatune)
- File upload with drag-and-drop support
- Form validation
- Data persistence using TinyDB
- Submission to external Express server (port 8090)
- Vue-inspired component architecture

## Technology Stack

- **Frontend**: React.js with Tailwind CSS and shadcn/ui components
- **Backend**: Express.js with TypeScript
- **Database**: TinyDB (Python-based JSON document database)
- **Architecture**: Vue-inspired components within React
- **Styling**: Tailwind CSS, shadcn/ui components
- **API Integration**: External form processing server (port 8090)

## Installation

Please see the [Deployment Guide](./DEPLOYMENT_GUIDE.md) for detailed installation instructions.

## Development

This project was built with a focus on simplicity and user experience. The form includes validation to ensure at least one feature option is selected, and the file upload component supports both drag-and-drop and traditional file selection.

### Key Features

1. **Feature Selection**
   - BPM, Key, Approachability, and Engagement options
   - At least one option must be selected
   - Validation feedback

2. **Classification Model**
   - Radio button selection
   - Options for Discogs-Effnet, Musicnn, and Magnatagatune models

3. **File Upload**
   - Drag-and-drop support
   - File size validation (10MB limit)
   - File type information display

4. **External Server Integration**
   - Submits form data to Express server on port 8090
   - CORS-enabled for cross-origin requests
   - Proper error handling

5. **Database Integration**
   - TinyDB for lightweight data storage
   - Python-TypeScript bridge for database operations
   - Persistent storage in JSON format

## Screenshots

[Screenshots would be included here]

## License

This project is licensed under the MIT License.