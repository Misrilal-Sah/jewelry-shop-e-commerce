/**
 * Test rembg Python fallback
 * Run: node scripts/testRembg.js
 * 
 * This tests the rembg Python library independently.
 * Make sure rembg is installed: pip install rembg[cli]
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const testRembg = async () => {
  console.log('🧪 Testing rembg Python fallback...\n');
  
  // Check if rembg is installed
  console.log('1️⃣ Checking if rembg is installed...');
  
  const rembgVersion = spawn('python', ['-m', 'rembg.cli', '--version']);
  
  rembgVersion.stdout.on('data', (data) => {
    console.log('   ✅ rembg version:', data.toString().trim());
  });
  
  rembgVersion.stderr.on('data', (data) => {
    // stderr may also contain version info
  });
  
  rembgVersion.on('error', (err) => {
    if (err.code === 'ENOENT') {
      console.log('   ❌ Python NOT FOUND!');
      console.log('\n   Make sure Python is installed and in PATH\n');
      process.exit(1);
    }
  });
  
  rembgVersion.on('close', async (code) => {
    if (code !== 0 && code !== null) {
      console.log('   ❌ rembg check failed');
      return;
    }
    
    console.log('\n2️⃣ Testing background removal...');
    
    // Find a test image
    const testImagesDir = path.join(__dirname, '../public/backgrounds');
    const testFiles = fs.readdirSync(testImagesDir);
    
    if (testFiles.length === 0) {
      console.log('   ⚠️ No test images found in public/backgrounds');
      return;
    }
    
    const testImage = path.join(testImagesDir, testFiles[0]);
    const outputPath = path.join(__dirname, '../temp/rembg_test_output.png');
    
    // Ensure temp dir exists
    fs.mkdirSync(path.join(__dirname, '../temp'), { recursive: true });
    
    console.log(`   Input: ${testFiles[0]}`);
    console.log(`   Output: rembg_test_output.png`);
    
    const startTime = Date.now();
    
    const rembg = spawn('python', ['-m', 'rembg.cli', 'i', testImage, outputPath]);
    
    rembg.stderr.on('data', (data) => {
      // rembg outputs progress to stderr
      process.stdout.write('   ' + data.toString());
    });
    
    rembg.on('close', (code) => {
      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      
      // Give a moment for file to be written
      setTimeout(() => {
        if (fs.existsSync(outputPath)) {
          const outputSize = fs.statSync(outputPath).size;
          if (outputSize > 0) {
            console.log(`\n   ✅ SUCCESS! Background removed in ${duration}s`);
            console.log(`   Output size: ${(outputSize / 1024).toFixed(1)} KB`);
            console.log(`\n   Check: backend/temp/rembg_test_output.png`);
          } else {
            console.log(`\n   ❌ FAILED: Output file is empty`);
          }
        } else {
          console.log(`\n   ❌ FAILED: Output file not created (exit code: ${code})`);
        }
        process.exit(0);
      }, 500);
    });
    
    rembg.on('error', (err) => {
      console.log('   ❌ Error:', err.message);
      process.exit(1);
    });
  });
};

testRembg();
