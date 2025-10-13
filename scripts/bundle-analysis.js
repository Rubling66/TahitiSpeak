const fs = require('fs');
const path = require('path');

// Simple bundle analysis script
function analyzeBundleSize() {
  console.log('🔍 Bundle Analysis Report');
  console.log('========================\n');

  // Check if .next directory exists
  const nextDir = path.join(process.cwd(), '.next');
  if (!fs.existsSync(nextDir)) {
    console.log('❌ No build found. Please run "npm run build" first.');
    return;
  }

  // Analyze static chunks
  const staticDir = path.join(nextDir, 'static', 'chunks');
  if (fs.existsSync(staticDir)) {
    const chunks = fs.readdirSync(staticDir);
    let totalSize = 0;
    
    console.log('📦 JavaScript Chunks:');
    chunks.forEach(chunk => {
      if (chunk.endsWith('.js')) {
        const filePath = path.join(staticDir, chunk);
        const stats = fs.statSync(filePath);
        const sizeKB = (stats.size / 1024).toFixed(2);
        totalSize += stats.size;
        
        console.log(`  ${chunk}: ${sizeKB} KB`);
      }
    });
    
    console.log(`\n📊 Total JS Size: ${(totalSize / 1024).toFixed(2)} KB`);
  }

  // Check for large dependencies
  console.log('\n🔍 Recommendations:');
  console.log('  • Consider code splitting for large components');
  console.log('  • Use dynamic imports for heavy libraries');
  console.log('  • Optimize images and assets');
  console.log('  • Remove unused dependencies');
  
  // Suggest optimizations
  console.log('\n⚡ Optimization Suggestions:');
  console.log('  • Implement lazy loading for dashboard components');
  console.log('  • Use React.memo for expensive components');
  console.log('  • Split vendor bundles');
  console.log('  • Compress assets with gzip/brotli');
}