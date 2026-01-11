const { execSync, exec } = require('child_process');
const fs = require('fs');
const path = require('path');

const PROJECT_DIR = __dirname;
const SCREENSHOTS_DIR = path.join(PROJECT_DIR, 'deck-screenshots');
const VIDEO_DIR = path.join(PROJECT_DIR, 'video-output');
const AUDIO_DIR = path.join(VIDEO_DIR, 'audio');

// Create output directories
if (!fs.existsSync(VIDEO_DIR)) fs.mkdirSync(VIDEO_DIR, { recursive: true });
if (!fs.existsSync(AUDIO_DIR)) fs.mkdirSync(AUDIO_DIR, { recursive: true });

// Script sections with narration and corresponding screenshots
const sections = [
  {
    id: '01-intro',
    screenshot: null, // Will create title card
    duration: 8,
    text: `Welcome to the Forecasting Grid. A powerful, enterprise-scale planning interface designed for finance teams, operations managers, and business planners. In this demo, I'll walk you through every capability, showing you not just what it does, but why each feature matters for real planning workflows.`
  },
  {
    id: '02-list-view',
    screenshot: '01-list-view.png',
    duration: 15,
    text: `The application follows a familiar three-level navigation pattern. Users access their forecasts through the Planning and Forecasting tab in the global header. This List View shows all forecast records, think of it as your forecasting home base. A finance director starts their day here, seeing all active forecasts. They can quickly identify which ones need attention based on status and last modified dates.`
  },
  {
    id: '03-record-page',
    screenshot: '02-record-details.png',
    duration: 12,
    text: `Clicking any forecast opens the Record Page, the configuration hub. The Details tab shows key metadata: the forecast name, admin template, start and end periods, and default settings for measures and time granularity. This is where planners configure what data appears before diving into the numbers.`
  },
  {
    id: '04-grid-config',
    screenshot: '03-record-gridconfig.png',
    duration: 12,
    text: `The Grid Configuration tab is where planners define their dimensional scope. They select accounts, define category criteria using conditional logic, and set up exactly which data the grid will display. Before diving into numbers, a planning analyst configures their grid to focus only on what matters.`
  },
  {
    id: '05-grid-main',
    screenshot: '04-grid-main.png',
    duration: 20,
    text: `This is the heart of the application, the Grid View. Notice the first column stays frozen as you scroll horizontally, you never lose context. The header rows stay sticky during vertical scroll, so time periods remain visible no matter how deep you go. The grid supports three layouts: Measures over Dimensions by Time for finance teams, Dimensions over Time by Measures for operations, and Time over Dimensions by Measures for trend analysis.`
  },
  {
    id: '06-settings',
    screenshot: '04-grid-main.png',
    duration: 18,
    text: `The Settings Panel lets you configure how the grid displays. Dimension Levels toggle Account, Category, or Product visibility. Time Granularity controls temporal detail, from Years down to Months. Date Range filtering lets you focus on specific periods. Column Width adjusts cell size. Expand and Collapse All buttons help navigate large data sets. And Reorder Measures lets you drag measures into your preferred order.`
  },
  {
    id: '07-filters',
    screenshot: '04-grid-main.png',
    duration: 12,
    text: `While Settings configure the view, Filters help you explore the data. They're applied instantly, no Apply button needed. Measure Subgroup toggles between Revenue and Quantity versus Adjustment Measures. Dimension and Time filters enable rapid data exploration during analysis.`
  },
  {
    id: '08-interactions',
    screenshot: '08-context-menu.png',
    duration: 18,
    text: `Cell interactions are designed to feel familiar. Single Click selects a cell and shows an info popover if it has edit history. Shift plus Click selects a range. Command Click toggles individual cells. Double click enters edit mode, type your new value, press Enter to save. Right-click opens a context menu with Copy, Paste, Lock, Unlock, and Mass Update options.`
  },
  {
    id: '09-cell-details',
    screenshot: '04-grid-main.png',
    duration: 15,
    text: `The Cell Details Panel provides deep context. Cell Information shows the full coordinates: measure, account, category, product, and time period. Edit History displays a chronological log of who edited, when, and the percentage change. This is your audit trail. Adjustment Notes let users add context to their changes.`
  },
  {
    id: '10-mass-update',
    screenshot: '04-grid-main.png',
    duration: 12,
    text: `When multiple cells are selected, the Multi Cell Tab enables bulk operations. Mass Update lets you Increase all selected cells by a percentage, Decrease them, or Set them to a specific value. Leadership announces a 5 percent uplift? Select the cells, apply the increase, and dozens of cells update in seconds.`
  },
  {
    id: '11-propagation',
    screenshot: '04-grid-main.png',
    duration: 18,
    text: `Value propagation maintains mathematical consistency across your hierarchy. When you edit a child cell, parent totals automatically recalculate. When you edit a parent cell, the system proportionally distributes the change to children. Locked cells are excluded from propagation, protecting confirmed values like contract amounts from accidental changes.`
  },
  {
    id: '12-closing',
    screenshot: null,
    duration: 12,
    text: `That's the Forecasting Grid: a comprehensive planning interface that balances power with usability. Three navigation levels, three grid layouts, configurable settings, real-time filters, familiar editing patterns, full audit history, and intelligent value propagation. Every feature reduces cognitive load while enabling enterprise-scale planning workflows. Thank you for watching.`
  }
];

// Create a simple title card image
function createTitleCard(outputPath, title, subtitle) {
  const svg = `
<svg width="1440" height="900" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#0176d3"/>
      <stop offset="100%" style="stop-color:#00a1e0"/>
    </linearGradient>
  </defs>
  <rect width="1440" height="900" fill="url(#bg)"/>
  <text x="720" y="380" font-family="Arial, sans-serif" font-size="72" font-weight="bold" fill="white" text-anchor="middle">${title}</text>
  <text x="720" y="460" font-family="Arial, sans-serif" font-size="32" fill="rgba(255,255,255,0.9)" text-anchor="middle">${subtitle}</text>
  <text x="720" y="550" font-family="Arial, sans-serif" font-size="20" fill="rgba(255,255,255,0.7)" text-anchor="middle">Feature Demo • January 2026</text>
</svg>`;
  
  const svgPath = outputPath.replace('.png', '.svg');
  fs.writeFileSync(svgPath, svg);
  
  // Convert SVG to PNG using sips (macOS built-in)
  try {
    // Use ImageMagick's convert if available, otherwise create a placeholder
    execSync(`which convert && convert ${svgPath} ${outputPath}`, { stdio: 'pipe' });
  } catch {
    // Fallback: copy an existing screenshot and we'll overlay text in the video
    const fallbackImg = path.join(SCREENSHOTS_DIR, '04-grid-main.png');
    if (fs.existsSync(fallbackImg)) {
      fs.copyFileSync(fallbackImg, outputPath);
    }
  }
  
  return outputPath;
}

// Generate audio using macOS 'say' command
async function generateAudio(text, outputPath) {
  return new Promise((resolve, reject) => {
    const aiffPath = outputPath.replace('.mp3', '.aiff');
    
    // Use 'say' to create AIFF file with Samantha voice (good quality)
    const sayCmd = `say -v Samantha -o "${aiffPath}" "${text.replace(/"/g, '\\"')}"`;
    
    exec(sayCmd, (error) => {
      if (error) {
        console.error(`Error generating audio: ${error}`);
        reject(error);
        return;
      }
      
      // Convert AIFF to MP3 using ffmpeg
      const ffmpegCmd = `ffmpeg -y -i "${aiffPath}" -acodec libmp3lame -ab 192k "${outputPath}"`;
      exec(ffmpegCmd, (error2) => {
        if (error2) {
          console.error(`Error converting to MP3: ${error2}`);
          reject(error2);
          return;
        }
        
        // Clean up AIFF
        try { fs.unlinkSync(aiffPath); } catch {}
        resolve(outputPath);
      });
    });
  });
}

// Get audio duration using ffprobe
function getAudioDuration(audioPath) {
  try {
    const result = execSync(`ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${audioPath}"`);
    return parseFloat(result.toString().trim());
  } catch {
    return 10; // Default duration
  }
}

// Create video segment from image and audio
async function createVideoSegment(imagePath, audioPath, outputPath, duration) {
  return new Promise((resolve, reject) => {
    // Create video with image and audio
    const cmd = `ffmpeg -y -loop 1 -i "${imagePath}" -i "${audioPath}" -c:v libx264 -tune stillimage -c:a aac -b:a 192k -pix_fmt yuv420p -shortest -t ${duration + 1} "${outputPath}"`;
    
    exec(cmd, (error) => {
      if (error) {
        console.error(`Error creating segment: ${error}`);
        reject(error);
        return;
      }
      resolve(outputPath);
    });
  });
}

// Concatenate all video segments
async function concatenateVideos(segmentPaths, outputPath) {
  // Create a file list for ffmpeg
  const listPath = path.join(VIDEO_DIR, 'segments.txt');
  const listContent = segmentPaths.map(p => `file '${p}'`).join('\n');
  fs.writeFileSync(listPath, listContent);
  
  return new Promise((resolve, reject) => {
    const cmd = `ffmpeg -y -f concat -safe 0 -i "${listPath}" -c copy "${outputPath}"`;
    
    exec(cmd, (error) => {
      if (error) {
        console.error(`Error concatenating: ${error}`);
        reject(error);
        return;
      }
      resolve(outputPath);
    });
  });
}

async function main() {
  console.log('🎬 Starting video generation...\n');
  
  const segmentPaths = [];
  
  for (let i = 0; i < sections.length; i++) {
    const section = sections[i];
    console.log(`Processing section ${i + 1}/${sections.length}: ${section.id}`);
    
    // Determine image path
    let imagePath;
    if (section.screenshot) {
      imagePath = path.join(SCREENSHOTS_DIR, section.screenshot);
      if (!fs.existsSync(imagePath)) {
        // Fallback to main grid
        imagePath = path.join(SCREENSHOTS_DIR, '04-grid-main.png');
      }
    } else {
      // Create title/closing card
      imagePath = path.join(VIDEO_DIR, `${section.id}-card.png`);
      const title = section.id.includes('intro') ? 'Forecasting Grid' : 'Thank You';
      const subtitle = section.id.includes('intro') ? 'Feature Demo' : 'Questions?';
      createTitleCard(imagePath, title, subtitle);
      
      // If title card creation failed, use grid screenshot
      if (!fs.existsSync(imagePath)) {
        imagePath = path.join(SCREENSHOTS_DIR, '04-grid-main.png');
      }
    }
    
    // Generate audio
    const audioPath = path.join(AUDIO_DIR, `${section.id}.mp3`);
    console.log(`  - Generating audio...`);
    
    try {
      await generateAudio(section.text, audioPath);
    } catch (err) {
      console.error(`  - Audio generation failed, skipping section`);
      continue;
    }
    
    // Get actual audio duration
    const audioDuration = getAudioDuration(audioPath);
    console.log(`  - Audio duration: ${audioDuration.toFixed(1)}s`);
    
    // Create video segment
    const segmentPath = path.join(VIDEO_DIR, `${section.id}.mp4`);
    console.log(`  - Creating video segment...`);
    
    try {
      await createVideoSegment(imagePath, audioPath, segmentPath, audioDuration);
      segmentPaths.push(segmentPath);
    } catch (err) {
      console.error(`  - Segment creation failed`);
    }
  }
  
  if (segmentPaths.length === 0) {
    console.error('\n❌ No segments created. Check ffmpeg installation.');
    return;
  }
  
  // Concatenate all segments
  console.log('\n📼 Concatenating segments...');
  const finalVideoPath = path.join(PROJECT_DIR, 'forecasting-grid-demo.mp4');
  
  try {
    await concatenateVideos(segmentPaths, finalVideoPath);
    console.log(`\n✅ Video created: ${finalVideoPath}`);
  } catch (err) {
    console.error('\n❌ Failed to create final video');
  }
  
  // Cleanup
  console.log('\n🧹 Cleaning up temporary files...');
  // Keep the final video, remove segments
  
  console.log('\n🎉 Done!');
}

main().catch(console.error);


