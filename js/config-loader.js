/* =====================
   Configuration Loader
   Loads school-specific configuration
   ===================== */

// Default school config (can be overridden via URL parameter or localStorage)
const DEFAULT_SCHOOL = 'nn-vikings';

// Get school identifier from URL parameter or localStorage
function getSchoolIdFromStorage() {
  const urlParams = new URLSearchParams(window.location.search);
  const schoolParam = urlParams.get('school');
  
  if (schoolParam) {
    // Store in localStorage for persistence
    localStorage.setItem('sdc_school_id', schoolParam);
    return schoolParam;
  }
  
  // Check localStorage
  const stored = localStorage.getItem('sdc_school_id');
  if (stored) {
    return stored;
  }
  
  return DEFAULT_SCHOOL;
}

// Load school configuration dynamically
let currentConfig = null;

export async function loadSchoolConfig() {
  if (currentConfig) {
    return currentConfig;
  }
  
  const schoolId = getSchoolIdFromStorage();
  
  try {
    // Dynamically import the school config
    const configModule = await import(`../config/${schoolId}.js`);
    currentConfig = configModule.SCHOOL_CONFIG;
    
    // Apply theme color to CSS
    applyTheme(currentConfig.themeColor);
    
    // Update page title and branding
    updateBranding(currentConfig);
    
    return currentConfig;
  } catch (error) {
    console.error(`Failed to load config for school: ${schoolId}`, error);
    // Fallback to default
    if (schoolId !== DEFAULT_SCHOOL) {
      console.log('Falling back to default school config');
      const defaultModule = await import(`../config/${DEFAULT_SCHOOL}.js`);
      currentConfig = defaultModule.SCHOOL_CONFIG;
      applyTheme(currentConfig.themeColor);
      updateBranding(currentConfig);
      return currentConfig;
    }
    throw error;
  }
}

// Apply theme color to CSS variables
function applyTheme(themeColor) {
  document.documentElement.style.setProperty('--bg1', themeColor);
  const metaTheme = document.querySelector('meta[name="theme-color"]');
  if (metaTheme) {
    metaTheme.setAttribute('content', themeColor);
  }
}

// Update page branding elements
function updateBranding(config) {
  // Update title
  document.title = config.fullName;
  
  // Update brand header
  const brandEl = document.querySelector('.brand');
  if (brandEl) {
    brandEl.textContent = config.name;
  }
  
  // Update manifest (if needed, this would require regenerating the manifest)
  // For now, we'll just update the visible elements
}

// Get current config (synchronous access after initial load)
export function getConfig() {
  if (!currentConfig) {
    throw new Error('Config not loaded yet. Call loadSchoolConfig() first.');
  }
  return currentConfig;
}

// Export school ID getter for other modules
export function getSchoolId() {
  return getSchoolIdFromStorage();
}

