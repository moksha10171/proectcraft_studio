import { CodeFile } from './types';

/**
 * Security Configuration
 * Fixed React versions for stability and security
 */
export const REACT_VERSION = '18.2.0';
export const REACT_DOM_VERSION = '18.2.0';
export const BABEL_VERSION = '7.23.0';

/**
 * Get React CDN URLs with fixed versions
 */
export function getReactCDN(): string {
    return `
<!-- React Dependencies - Fixed Versions for Security -->
<script crossorigin="anonymous" src="https://unpkg.com/react@${REACT_VERSION}/umd/react.production.min.js" referrerpolicy="no-referrer"></script>
<script crossorigin="anonymous" src="https://unpkg.com/react-dom@${REACT_DOM_VERSION}/umd/react-dom.production.min.js" referrerpolicy="no-referrer"></script>
<script src="https://unpkg.com/@babel/standalone@${BABEL_VERSION}/babel.min.js" referrerpolicy="no-referrer"></script>
`;
}

/**
 * Sanitize content to prevent XSS attacks
 */
function sanitizeContent(content: string): string {
    // Remove potentially dangerous patterns
    // Note: This is basic sanitization. For production, use a proper sanitizer library
    let sanitized = content;
    
    // Remove script tags (they're handled separately)
    sanitized = sanitized.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
    
    // Remove event handlers from HTML
    sanitized = sanitized.replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '');
    sanitized = sanitized.replace(/\s*on\w+\s*=\s*{[^}]*}/gi, '');
    
    // Remove javascript: protocol
    sanitized = sanitized.replace(/javascript:/gi, '');
    
    // Remove data: URLs that could be dangerous
    sanitized = sanitized.replace(/data:text\/html/gi, '');
    
    return sanitized;
}

/**
 * Validate file content for security issues
 * Exported for use in UI components
 */
export function validateFileSecurity(file: CodeFile): { safe: boolean; warnings: string[] } {
    const warnings: string[] = [];
    const content = file.content.toLowerCase();
    
    // Check for potentially dangerous patterns
    const dangerousPatterns = [
        { pattern: /eval\s*\(/gi, warning: 'eval() usage detected - security risk' },
        { pattern: /function\s+constructor/gi, warning: 'Function constructor usage detected' },
        { pattern: /innerhtml\s*=/gi, warning: 'innerHTML usage detected - potential XSS risk' },
        { pattern: /outerhtml\s*=/gi, warning: 'outerHTML usage detected - potential XSS risk' },
        { pattern: /document\.write/gi, warning: 'document.write() usage detected' },
        { pattern: /document\.writeln/gi, warning: 'document.writeln() usage detected' },
        { pattern: /\.src\s*=\s*["']javascript:/gi, warning: 'JavaScript protocol in src detected' },
        { pattern: /<iframe/gi, warning: 'iframe usage detected - security consideration' },
    ];
    
    dangerousPatterns.forEach(({ pattern, warning }) => {
        if (pattern.test(file.content)) {
            warnings.push(warning);
        }
    });
    
    return { safe: warnings.length === 0, warnings };
}

/**
 * Compiles project files into a single HTML document for preview
 * HTML is the main file - it compiles all CSS and JS files into it
 * Includes security measures and fixed React configuration
 */
export function compileToHTML(files: CodeFile[]): string {
    if (!files || files.length === 0) {
        return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Preview</title>
</head>
<body>
  <div id="root"></div>
</body>
</html>`;
    }

    // Find HTML file (should be the main one)
    const htmlFile = files.find(f => f.language === 'html');
    
    // Get ALL CSS files
    const cssFiles = files.filter(f => f.language === 'css');
    
    // Get ALL JavaScript files (including JSX, TSX, TS)
    const jsFiles = files.filter(f =>
        f.language === 'javascript' || 
        f.language === 'jsx' || 
        f.language === 'tsx' ||
        f.language === 'typescript'
    );

    // Base HTML structure - use HTML file if exists, otherwise create default
    // Security: Sanitize HTML content
    let html = htmlFile ? sanitizeContent(htmlFile.content) : `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://unpkg.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data: https:; connect-src 'self' https://unpkg.com;">
  <title>Preview</title>
</head>
<body>
  <div id="root"></div>
</body>
</html>`;

    // Ensure HTML has proper structure and security headers
    if (!html.includes('<!DOCTYPE') && !html.includes('<html')) {
        html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://unpkg.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data: https:; connect-src 'self' https://unpkg.com;">
  <title>Preview</title>
</head>
<body>
${html}
</body>
</html>`;
    } else if (!html.includes('Content-Security-Policy')) {
        // Add CSP if not present
        if (html.includes('<head>')) {
            html = html.replace('<head>', `<head>\n  <meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://unpkg.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data: https:; connect-src 'self' https://unpkg.com;">`);
        }
    }

    // Remove external stylesheet and script references for LOCAL files only (not CDN)
    // This prevents 404 errors for files that don't exist
    html = html.replace(/<link[^>]*href=["'](?!https?:\/\/)[^"']*\.css["'][^>]*>/gi, '');
    html = html.replace(/<script[^>]*src=["'](?!https?:\/\/)[^"']*["'][^>]*><\/script>/gi, '');

    // Ensure head and body tags exist
    if (!html.includes('<head>')) {
        const headMatch = html.match(/<head[^>]*>/i);
        if (!headMatch) {
            html = html.replace(/<html[^>]*>/i, (match) => `${match}\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <title>Preview</title>\n</head>`);
        }
    }

    if (!html.includes('<body>')) {
        html = html.replace(/<\/head>/i, '</head>\n<body>\n  <div id="root"></div>\n</body>');
    }

    // Inject ALL CSS files (sanitized)
    if (cssFiles.length > 0) {
        const cssContent = cssFiles.map(f => {
            // Remove any existing style tags if CSS file contains them
            let content = f.content.trim();
            content = content.replace(/<style[^>]*>/gi, '').replace(/<\/style>/gi, '');
            // Basic CSS sanitization - remove expression() and javascript: in CSS
            content = content.replace(/expression\s*\(/gi, '/* expression() removed for security */');
            content = content.replace(/javascript:/gi, '/* javascript: removed for security */');
            return `/* ${f.name} */\n${content}`;
        }).join('\n\n');
        
        const styleTag = `\n<style>\n${cssContent}\n</style>`;

        // Insert before closing head or at the end of head
        if (html.includes('</head>')) {
            html = html.replace('</head>', `${styleTag}\n</head>`);
        } else if (html.includes('<head>')) {
            html = html.replace('<head>', `<head>${styleTag}`);
        } else {
            html = `${styleTag}\n${html}`;
        }
    }

    // Inject ALL JavaScript files
    if (jsFiles.length > 0) {
        const hasReact = jsFiles.some(f => f.language === 'jsx' || f.language === 'tsx');

        let scriptContent = '';

        if (hasReact) {
            // For React, use FIXED versions for security and stability
            const reactCDN = getReactCDN();

            // Insert React CDN in head
            if (html.includes('</head>')) {
                html = html.replace('</head>', `${reactCDN}\n</head>`);
            } else if (html.includes('<head>')) {
                html = html.replace('<head>', `<head>${reactCDN}`);
            }

            // Compile ALL JS/JSX/TSX files, not just the first one
            // Apply security sanitization
            const allReactCode = jsFiles.map(f => {
                let content = f.content.trim();
                
                // Security: Validate file before processing
                const securityCheck = validateFileSecurity(f);
                if (!securityCheck.safe) {
                    console.warn(`Security warnings for ${f.name}:`, securityCheck.warnings);
                }
                
                // Remove script tags if present
                content = content.replace(/<script[^>]*>/gi, '').replace(/<\/script>/gi, '');
                
                // Remove import statements (they won't work in browser without bundler)
                // But keep React import comments for reference
                content = content.replace(/^import\s+.*?from\s+['"].*?['"];?\s*$/gm, '// Import removed - using CDN');
                
                // Security: Remove dangerous patterns
                content = sanitizeContent(content);
                
                // Handle export default - convert to window variable for global access
                // Pattern: export default ComponentName
                content = content.replace(/export\s+default\s+function\s+(\w+)/g, 'function $1');
                content = content.replace(/export\s+default\s+const\s+(\w+)\s*=/g, 'const $1 =');
                content = content.replace(/export\s+default\s+(\w+)/g, 'window.$1 = $1');
                
                // Also handle named exports that might be the main component
                content = content.replace(/export\s+(?:default\s+)?function\s+(\w+)/g, 'function $1\nwindow.$1 = $1');
                content = content.replace(/export\s+(?:default\s+)?const\s+(\w+)\s*=/g, 'const $1 =\nwindow.$1 = $1');
                
                return `/* ${f.name} */\n${content}`;
            }).join('\n\n');

            scriptContent = `
<script type="text/babel">
${allReactCode}

// Auto-render React components
(function renderReactApp() {
  // Wait for React and ReactDOM to load
  if (typeof React === 'undefined' || typeof ReactDOM === 'undefined') {
    setTimeout(renderReactApp, 50);
    return;
  }
  
  const rootElement = document.getElementById('root') || document.body;
  
  // Function to try rendering a component
  function tryRender(componentName, component) {
    if (component && typeof component === 'function') {
      try {
        const root = ReactDOM.createRoot(rootElement);
        root.render(React.createElement(component));
        // Component rendered successfully
        return true;
      } catch (err) {
        console.error('Error rendering', componentName + ':', err);
        return false;
      }
    }
    return false;
  }
  
  // Try common component names in order of preference
  const componentNames = ['App', 'Component', 'Main', 'Root', 'Home'];
  
  for (const name of componentNames) {
    if (typeof window[name] !== 'undefined') {
      if (tryRender(name, window[name])) {
        return;
      }
    }
  }
  
  // Try to find any capitalized function (React component convention)
  const allWindowKeys = Object.keys(window);
  const componentCandidates = allWindowKeys.filter(key => {
    if (key === 'React' || key === 'ReactDOM' || key === 'Babel') return false;
    const val = window[key];
    return typeof val === 'function' && 
           key.length > 0 && 
           key[0] === key[0].toUpperCase() &&
           !key.startsWith('HTML') &&
           !key.startsWith('XML');
  });
  
  if (componentCandidates.length > 0) {
    // Potential components found for debugging
    for (const candidate of componentCandidates) {
      if (tryRender(candidate, window[candidate])) {
        return;
      }
    }
  }
  
  // If still no component found, show helpful message
  console.warn('⚠ No React component found to render.');
  // Debug info: Available functions and tips (commented out for production)
  // console.log('Available functions:', allWindowKeys.filter(k => typeof window[k] === 'function'));
  // console.log('💡 Tip: Export your component as: window.App = App; or export default function App() {...}');
  
  // Show message in the UI with helpful React template
  rootElement.innerHTML = '<div style="padding: 20px; font-family: monospace; color: #ff6b6b; background: #1e1e1e; min-height: 100vh;"><h2>No React Component Found</h2><p>Make sure you export your component using one of these patterns:</p><pre style="background: #252526; padding: 15px; border-radius: 5px; margin: 10px 0;">// Pattern 1: Export default function\nfunction App() {\n  return &lt;div&gt;Hello World&lt;/div&gt;;\n}\nwindow.App = App;\n\n// Pattern 2: Export default (will be auto-converted)\nexport default function App() {\n  return &lt;div&gt;Hello World&lt;/div&gt;;\n}</pre><p style="color: #4ec9b0;">💡 Tip: The component name should start with a capital letter (App, Component, etc.)</p></div>';
})();
</script>`;
        } else {
            // Regular JavaScript/TypeScript - concatenate ALL files
            // Apply security sanitization
            const jsContent = jsFiles.map(f => {
                let content = f.content.trim();
                
                // Security: Validate file before processing
                const securityCheck = validateFileSecurity(f);
                if (!securityCheck.safe) {
                    console.warn(`Security warnings for ${f.name}:`, securityCheck.warnings);
                }
                
                // Remove script tags if present
                content = content.replace(/<script[^>]*>/gi, '').replace(/<\/script>/gi, '');
                
                // Security: Sanitize content
                content = sanitizeContent(content);
                
                return `/* ${f.name} */\n${content}`;
            }).join('\n\n');
            
            scriptContent = `\n<script>\n${jsContent}\n</script>`;
        }

        // Insert before closing body or at the end
        if (html.includes('</body>')) {
            html = html.replace('</body>', `${scriptContent}\n</body>`);
        } else if (html.includes('<body>')) {
            html = html.replace('<body>', `<body>${scriptContent}`);
        } else {
            html = `${html}\n${scriptContent}`;
        }
    }

    return html;
}

/**
 * Validates code syntax (basic checks)
 */
export function validateCode(file: CodeFile): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    try {
        if (file.language === 'javascript' || file.language === 'jsx') {
            // Basic syntax check - just try to parse it
            // In a real implementation, you'd use a proper parser
            const hasUnclosedBraces = (file.content.match(/{/g)?.length || 0) !== (file.content.match(/}/g)?.length || 0);
            const hasUnclosedParens = (file.content.match(/\(/g)?.length || 0) !== (file.content.match(/\)/g)?.length || 0);

            if (hasUnclosedBraces) {
                errors.push('Unclosed braces detected');
            }
            if (hasUnclosedParens) {
                errors.push('Unclosed parentheses detected');
            }
        }

        if (file.language === 'html') {
            // Check for basic HTML issues
            const openTags = file.content.match(/<(\w+)[^>]*>/g) || [];
            const closeTags = file.content.match(/<\/(\w+)>/g) || [];

            if (openTags.length > closeTags.length + 5) { // Some tags like img, br don't need closing
                errors.push('Possible unclosed HTML tags');
            }
        }

        return { valid: errors.length === 0, errors };
    } catch (error) {
        return { valid: false, errors: ['Syntax error in code'] };
    }
}

/**
 * Format code (basic formatting)
 */
export function formatCode(content: string, language: string): string {
    // In a real implementation, you'd use prettier or similar
    // For now, just return as-is
    return content;
}

/**
 * Create downloadable project content
 */
export function createDownloadableProject(files: CodeFile[]): Blob {
    // Create a markdown file with all files
    // In production, you could use JSZip to create actual zip files
    let content = '# Project Files\n\n';
    content += 'This file contains all your project files.\n';
    content += 'Copy each code block into a file with the corresponding name.\n\n';
    content += '---\n\n';

    files.forEach(file => {
        content += `## 📄 ${file.name}\n\n`;
        content += '```' + file.language + '\n';
        content += file.content;
        content += '\n```\n\n';
        content += '---\n\n';
    });

    content += `\n## Instructions\n\n`;
    content += `1. Create a new folder for your project\n`;
    content += `2. For each file above, create a new file with the name shown\n`;
    content += `3. Copy the code from the code block into the file\n`;
    content += `4. Save all files in the same folder\n`;
    content += `5. Open index.html in your browser to view your project\n`;

    return new Blob([content], { type: 'text/plain' });
}
