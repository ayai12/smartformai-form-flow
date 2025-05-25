/**
 * Helper utilities for embedding SmartFormAI surveys in external websites
 */

/**
 * Generates the standard iframe embed code for a survey
 * 
 * @param surveyUrl The full URL to the survey
 * @param title The title of the survey
 * @param options Optional configuration options
 * @returns HTML iframe code
 */
export const generateEmbedCode = (
  surveyUrl: string,
  title: string,
  options: {
    width?: string;
    height?: string;
    borderRadius?: string;
    shadow?: boolean;
  } = {}
): string => {
  const {
    width = '100%',
    height = '600px',
    borderRadius = '8px',
    shadow = true,
  } = options;

  const shadowStyle = shadow ? 'box-shadow:0 2px 10px rgba(0,0,0,0.08);' : '';
  
  return `<!-- SmartFormAI Survey Embed -->
<iframe 
  src="${surveyUrl}" 
  width="${width}" 
  height="${height}" 
  style="border:none;border-radius:${borderRadius};${shadowStyle}" 
  title="${title}"
  allow="geolocation"
  loading="lazy"
  scrolling="no"
  frameborder="0"
></iframe>
<script>
  // Add responsive height adjustment
  window.addEventListener('message', function(event) {
    // Check if message is from our survey
    if (event.data && event.data.type === 'resize' && event.data.height) {
      // Find all iframes
      const iframes = document.querySelectorAll('iframe');
      // Find the one with our survey URL
      for (let i = 0; i < iframes.length; i++) {
        if (iframes[i].src === "${surveyUrl}") {
          iframes[i].style.height = event.data.height + 'px';
          break;
        }
      }
    }
  });
</script>`;
};

/**
 * Generates JavaScript code that enables responsive height adjustment
 * for embedded surveys
 * 
 * @param containerSelector The CSS selector for the container where the iframe will be placed
 * @returns JavaScript code for advanced embedding
 */
export const generateAdvancedEmbedCode = (containerSelector: string = '#survey-container'): string => {
  return `
<!-- SmartFormAI Responsive Embed Code -->
<div id="survey-container"></div>

<script>
(function() {
  // Configuration
  const surveyUrl = "{{SURVEY_URL}}";
  const containerId = "${containerSelector.replace(/^#/, '')}";
  
  // Create or find container
  let container = document.getElementById(containerId);
  if (!container) {
    console.log("Creating survey container with id:", containerId);
    container = document.createElement('div');
    container.id = containerId;
    document.body.appendChild(container);
  }
  
  // Create iframe
  const iframe = document.createElement('iframe');
  iframe.src = surveyUrl;
  iframe.width = '100%';
  iframe.height = '600px';
  iframe.style.border = 'none';
  iframe.style.borderRadius = '8px';
  iframe.style.boxShadow = '0 2px 10px rgba(0,0,0,0.08)';
  iframe.title = "SmartFormAI Survey";
  iframe.allow = "geolocation";
  
  // Responsive height adjustment
  window.addEventListener('message', function(event) {
    // Verify origin for security
    const surveyOrigin = new URL(surveyUrl).origin;
    const allowedOrigins = [surveyOrigin, 'https://smartformai.vercel.app', 'https://smartformai.com'];
    if (!allowedOrigins.includes(event.origin)) return;
    
    // Handle height adjustment messages
    if (event.data && event.data.type === 'resize' && event.data.height) {
      iframe.style.height = event.data.height + 'px';
    }
  });
  
  // Add to container
  container.appendChild(iframe);
})();
</script>
`.trim();
};

/**
 * Generates the JavaScript snippet for adding the survey to a specific DOM element
 * 
 * @param surveyUrl The full URL to the survey
 * @param selector The CSS selector for the container element
 * @returns JavaScript code snippet
 */
export const generateInlineEmbedCode = (surveyUrl: string, selector: string = '#survey-container'): string => {
  return `
<script>
(function() {
  // Try to find the container
  let container = document.querySelector('${selector}');
  
  // If container doesn't exist, create it
  if (!container) {
    console.log("Creating container for survey:", "${selector}");
    container = document.createElement('div');
    
    // If selector is an ID, set the ID attribute
    if ('${selector}'.startsWith('#')) {
      container.id = '${selector}'.substring(1);
    } else {
      // Otherwise add a class
      container.className = '${selector}'.startsWith('.') ? 
        '${selector}'.substring(1) : 'smartformai-container';
    }
    
    // Append to body
    document.body.appendChild(container);
  }
  
  // Create and configure iframe
  const iframe = document.createElement('iframe');
  iframe.src = "${surveyUrl}";
  iframe.width = '100%';
  iframe.height = '600px';
  iframe.style.border = 'none';
  iframe.style.borderRadius = '8px';
  iframe.style.boxShadow = '0 2px 10px rgba(0,0,0,0.08)';
  iframe.title = "SmartFormAI Survey";
  iframe.allow = "geolocation";
  
  // Add responsive height adjustment
  window.addEventListener('message', function(event) {
    // Verify origin for security
    const surveyOrigin = new URL("${surveyUrl}").origin;
    const allowedOrigins = [surveyOrigin, 'https://smartformai.vercel.app', 'https://smartformai.com'];
    if (!allowedOrigins.includes(event.origin)) return;
    
    // Handle height adjustment messages
    if (event.data && event.data.type === 'resize' && event.data.height) {
      iframe.style.height = event.data.height + 'px';
    }
  });
  
  // Add to container
  container.appendChild(iframe);
})();
</script>
`.trim();
};

/**
 * Utility function to send resize messages from within the iframe to the parent
 * to enable responsive height adjustment
 */
export const setupResponsiveEmbed = (): void => {
  if (window.self === window.top) return; // Not in an iframe
  
  // Function to notify parent about height changes
  const notifyParent = () => {
    const height = document.body.scrollHeight;
    window.parent.postMessage({ type: 'resize', height }, '*');
  };
  
  // Set up observers
  const resizeObserver = new ResizeObserver(notifyParent);
  resizeObserver.observe(document.body);
  
  // Also notify on load and any DOM changes
  window.addEventListener('load', notifyParent);
  const mutationObserver = new MutationObserver(notifyParent);
  mutationObserver.observe(document.body, { 
    childList: true, 
    subtree: true, 
    attributes: true 
  });
}; 