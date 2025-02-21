# Academic Paper Tab Renamer

A Chrome extension that automatically renames browser tabs containing academic papers to their actual titles, making it easier to navigate through multiple research papers.

## Features

- Automatically renames tabs containing academic papers to their actual titles
- Supports multiple academic platforms:
  - arXiv
  - OpenReview
  - Semantic Scholar
  - ACM Digital Library
  - IEEE Xplore
  - SpringerLink
  - ScienceDirect
- Clean and simple popup interface
- Offline cache for previously renamed tabs
- Minimal permissions required
- Privacy-focused with no data collection

## Installation

### Manual Installation (Developer Mode)
1. Download or clone this repository
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked" and select the `dist` folder from this repository (see instructions on how to create `dist` below at **Setup**)
5. The extension icon should appear in your Chrome toolbar

### From Chrome Web Store **[Still WIP]**
1. Visit the [Chrome Web Store page](#) (link coming soon)
2. Click "Add to Chrome"
3. Confirm the installation

## Usage

1. The extension automatically activates when you open a supported academic paper
2. The tab will be renamed to the paper's actual title
3. Click the extension icon to see:
   - Extension status
   - Number of renamed tabs
   - Cache size
   - Option to clear cache

## Privacy & Security

This extension is designed with privacy and security in mind:

- No data collection or tracking
- All processing happens locally in your browser
- No external servers except the official APIs of academic platforms
- Minimal permissions required:
  - `activeTab`: Required to rename the current tab (more privacy-friendly than broad tabs access)
  - `storage`: Required for caching paper metadata
- Host permissions are limited to specific academic websites
- Strong Content Security Policy (CSP) implemented

## Development

### Prerequisites
- Node.js (version 14.15.0 or higher)
- npm

#### Ubuntu/Debian Additional Requirements
If you're on Ubuntu or Debian, you'll need to install some additional dependencies for the image processing:
```bash
# Install required system libraries for sharp
sudo apt-get update
sudo apt-get install -y build-essential libvips-dev
```

### Setup
```bash
# Check your Node version first
node --version  # Should be >=14.15.0

# Install dependencies
npm install

# Build the extension (with icon generation)
npm run build

# If you're having issues with sharp/icon generation:
npm run build:no-icons

# Development with watch mode
npm run dev

# Run tests
npm run test

# Type checking
npm run type-check

# Linting
npm run lint
```

If you encounter any `sharp`-related errors:
1. Try installing the system dependencies (Ubuntu/Debian) as shown above
2. If issues persist, use `npm run build:no-icons` instead
3. For other Linux distributions, check [sharp's installation guide](https://sharp.pixelplumbing.com/install)

### Project Structure
```
├── src/
│   ├── api/          # API integration
│   ├── background/   # Service worker
│   ├── content/      # Content scripts
│   ├── popup/        # Popup UI
│   ├── types/        # TypeScript types
│   └── utils/        # Utilities
├── dist/             # Built extension
└── tests/            # Test files
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

If you encounter any issues or have questions, please:
1. Check the [Issues](https://github.com/joanvelja/arxiv_extension/issues) page
2. Create a new issue if your problem isn't already listed
3. Provide as much detail as possible, including:
   - Chrome version
   - Extension version
   - Steps to reproduce
   - Expected vs actual behavior

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for a list of changes and version history. 
