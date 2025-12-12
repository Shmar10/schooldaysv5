# Multi-School Configuration System

## Overview

Your school calendar app now supports multiple schools through a configuration-based system. This allows you to:

- Maintain one codebase for all schools
- Easily add new schools by creating configuration files
- Switch between schools via URL parameter
- Keep school-specific data separate and organized

## Quick Start for Adding a New School

1. **Create a new config file**:
   ```bash
   cp config/school-template.js config/other-school.js
   ```

2. **Edit `config/other-school.js`** with the new school's information:
   - School name and branding
   - Calendar dates (first day, last day)
   - Holidays and non-attendance days
   - Bell schedules (regular, late start, exams, etc.)
   - Special dates and events

3. **Access the new school**:
   - Visit: `index.html?school=other-school`
   - The selection is saved in localStorage

## How It Works

### Configuration Loading

1. The app checks for a `?school=name` URL parameter
2. If found, it loads `config/name.js`
3. If not found, it checks localStorage for a saved preference
4. If neither exists, it defaults to `nn-vikings`

### What Gets Configured

Each school configuration includes:

- **Branding**: School name, colors, theme
- **Calendar**: First/last day, holidays, breaks
- **Schedules**: All bell schedules (regular, late start, exams)
- **Special Dates**: Date-specific schedule overrides
- **Marking Periods**: Grading periods and reporting dates

### File Structure

```
config/
  ├── README.md              # Detailed configuration docs
  ├── nn-vikings.js          # Current school (default)
  ├── school-template.js     # Template for new schools
  └── other-school.js         # Example: second school config
```

## Switching Between Schools

### Method 1: URL Parameter
```
index.html?school=other-school
```

### Method 2: localStorage (persistent)
Once you visit with `?school=name`, it's saved and will be used on future visits.

### Method 3: Programmatic
You can also switch schools programmatically:
```javascript
localStorage.setItem('sdc_school_id', 'other-school');
location.reload();
```

## Creating a School Configuration

See `config/README.md` for detailed documentation on:
- Configuration structure
- Schedule format
- Date formats
- Examples

## Benefits of This Approach

✅ **Single Codebase**: One codebase for all schools  
✅ **Easy Updates**: Update shared code once, affects all schools  
✅ **Independent Data**: Each school's calendar is separate  
✅ **Simple Setup**: Just create a config file to add a school  
✅ **Flexible**: Easy to customize per school  

## Alternative: Completely Separate Versions

If you prefer completely separate deployments (different folders/repos), you can:

1. Copy the entire project to a new folder
2. Update `config/nn-vikings.js` (or create a new config)
3. Deploy separately

However, the configuration-based approach is recommended because:
- Easier to maintain and update
- Shared bug fixes and features
- Less code duplication

## Current Schools

- **NN Vikings** (`nn-vikings`) - Default school
- Add more by creating config files in `config/`

## Notes

- Each school's user overrides (custom schedules) are stored separately in localStorage
- Theme colors are applied dynamically
- The manifest.webmanifest file is static - if you need school-specific PWA settings, you may want separate manifest files per school
- All JavaScript files automatically use the loaded configuration

