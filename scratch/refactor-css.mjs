import fs from 'fs';
import path from 'path';

const cssPath = path.resolve('e:/Reflections/index.css');
let css = fs.readFileSync(cssPath, 'utf8');

// Replace rgba(var(--panel-bg-rgb), alpha) with oklch(from var(--panel-bg) l c h / alpha)
css = css.replace(/rgba\(var\(--panel-bg-rgb\),\s*([0-9.]+)\)/g, 'oklch(from var(--panel-bg) l c h / $1)');

// Replace rgb(var(--black-rgb) / alpha) with oklch(0 0 0 / alpha)
css = css.replace(/rgb\(var\(--black-rgb\)\s*\/\s*([0-9.]+)\)/g, 'oklch(0 0 0 / $1)');

// Replace rgba(0, 0, 0, alpha) with a tinted shadow token approach
// Wait, the tinted shadow was specified as oklch(from var(--bg-color) 0.2 0.01 h / alpha)
css = css.replace(/rgba\(0,\s*0,\s*0,\s*([0-9.]+)\)/g, 'oklch(from var(--bg-color) 0.2 0.01 h / $1)');

// Replace rgba(255, 255, 255, alpha) with oklch(1 0 0 / alpha)
css = css.replace(/rgba\(255,\s*255,\s*255,\s*([0-9.]+)\)/g, 'oklch(1 0 0 / $1)');

// Remove --panel-bg-rgb and --black-rgb definitions
css = css.replace(/--panel-bg-rgb:\s*[^;]+;\n?/g, '');
css = css.replace(/--black-rgb:\s*[^;]+;\n?/g, '');

fs.writeFileSync(cssPath, css, 'utf8');
console.log('CSS refactored successfully.');
