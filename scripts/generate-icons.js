const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const sourceImage = path.join(__dirname, '../public/E2W Black Logo.png');
const outputDir = path.join(__dirname, '../public/icons');

// Ensure output directory exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Icon sizes needed for PWA
const mainIconSizes = [72, 96, 128, 144, 152, 192, 384, 512];

// Favicon sizes
const faviconSizes = [16, 32];

async function generateIcons() {
  console.log('Starting icon generation...\n');

  try {
    // Generate main PWA icons
    console.log('Generating main PWA icons...');
    for (const size of mainIconSizes) {
      const outputPath = path.join(outputDir, `icon-${size}x${size}.png`);
      await sharp(sourceImage)
        .resize(size, size, {
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 1 }
        })
        .png()
        .toFile(outputPath);
      console.log(`✓ Created ${size}x${size} icon`);
    }

    // Generate favicon sizes
    console.log('\nGenerating favicon sizes...');
    for (const size of faviconSizes) {
      const outputPath = path.join(outputDir, `favicon-${size}x${size}.png`);
      await sharp(sourceImage)
        .resize(size, size, {
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 1 }
        })
        .png()
        .toFile(outputPath);
      console.log(`✓ Created favicon ${size}x${size}`);
    }

    // Copy the 512x512 to apple-touch-icon
    console.log('\nGenerating Apple touch icon...');
    await sharp(sourceImage)
      .resize(180, 180, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 1 }
      })
      .png()
      .toFile(path.join(outputDir, 'apple-touch-icon.png'));
    console.log('✓ Created apple-touch-icon.png (180x180)');

    // Generate shortcut icons with different colors/overlays
    console.log('\nGenerating shortcut icons...');

    // Dashboard icon (use base logo)
    await sharp(sourceImage)
      .resize(96, 96, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 1 }
      })
      .png()
      .toFile(path.join(outputDir, 'dashboard-96x96.png'));
    console.log('✓ Created dashboard-96x96.png');

    // Tasks icon (use base logo)
    await sharp(sourceImage)
      .resize(96, 96, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 1 }
      })
      .png()
      .toFile(path.join(outputDir, 'tasks-96x96.png'));
    console.log('✓ Created tasks-96x96.png');

    // Projects icon (use base logo)
    await sharp(sourceImage)
      .resize(96, 96, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 1 }
      })
      .png()
      .toFile(path.join(outputDir, 'projects-96x96.png'));
    console.log('✓ Created projects-96x96.png');

    // Add icon (use base logo)
    await sharp(sourceImage)
      .resize(96, 96, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 1 }
      })
      .png()
      .toFile(path.join(outputDir, 'add-96x96.png'));
    console.log('✓ Created add-96x96.png');

    console.log('\n✅ All icons generated successfully!');
    console.log(`📁 Icons saved to: ${outputDir}`);

    // List all generated files
    const files = fs.readdirSync(outputDir);
    console.log(`\n📋 Generated ${files.length} files:`);
    files.forEach(file => console.log(`   - ${file}`));

  } catch (error) {
    console.error('❌ Error generating icons:', error);
    process.exit(1);
  }
}

generateIcons();
