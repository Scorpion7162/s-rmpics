const fs = require('fs');
const path = require('path');

// Define paths
const imagesDir = 'ENTER_DIR_HERE'; // Replace with the actual path to your images directory
const itemsLuaPath = 'ENTER_DIR_HERE'; // Replace with the actual path to your items.lua file
const weaponsLuaPath = 'ENTER_DIR_HERE'; // Replace with the actual path to your weapons.lua file

// Function to extract item names from Lua files
function extractItemNames(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        
        // Find all item definitions in all possible formats: ['item_name'], ["item_name"], [`item_name`]
        const singleQuoteRegex = /\['([^']+)'\]/g;
        const doubleQuoteRegex = /\["([^"]+)"\]/g;
        const backtickRegex = /\[`([^`]+)`\]/g;
        
        const itemNames = new Set();
        
        // Process single quotes
        const singleQuoteMatches = content.matchAll(singleQuoteRegex);
        for (const match of singleQuoteMatches) {
            itemNames.add(match[1]);
        }
        
        // Process double quotes
        const doubleQuoteMatches = content.matchAll(doubleQuoteRegex);
        for (const match of doubleQuoteMatches) {
            itemNames.add(match[1]);
        }
        
        // Process backticks
        const backtickMatches = content.matchAll(backtickRegex);
        for (const match of backtickMatches) {
            itemNames.add(match[1]);
        }
        
        // Also find any items defined with image property (with all quote types)
        const imageRegex = /image\s*=\s*(['"`])([^'"`]+)\1/g;
        const imageMatches = content.matchAll(imageRegex);
        
        for (const match of imageMatches) {
            itemNames.add(match[2]);
        }
        
        return itemNames;
    } catch (err) {
        console.error(`Error reading file ${filePath}:`, err);
        return new Set();
    }
}

// Get all image files from directory
function getImageFiles(directory) {
    try {
        return fs.readdirSync(directory)
            .filter(file => {
                const ext = path.extname(file).toLowerCase();
                return ['.png', '.jpg', '.jpeg', '.gif', '.webp'].includes(ext);
            })
            .map(file => path.parse(file).name);
    } catch (err) {
        console.error(`Error reading directory ${directory}:`, err);
        return [];
    }
}

// Main function
function cleanupUnusedImages() {
    // Get all defined items
    const itemsFromItemsLua = extractItemNames(itemsLuaPath);
    const itemsFromWeaponsLua = extractItemNames(weaponsLuaPath);
    
    // Combine all items
    const allDefinedItems = new Set([...itemsFromItemsLua, ...itemsFromWeaponsLua]);
    
    console.log(`Found ${allDefinedItems.size} defined items in Lua files.`);
    
    // Get all image files
    const imageFiles = getImageFiles(imagesDir);
    console.log(`Found ${imageFiles.length} image files in directory.`);
    
    // Find unused images
    const unusedImages = imageFiles.filter(imageName => !allDefinedItems.has(imageName));
    
    console.log(`Found ${unusedImages.length} unused images.`);
    
    // Delete unused images
    let deletedCount = 0;
    let errorCount = 0;
    
    for (const imageName of unusedImages) {
        // Get all files with this name but different extensions
        const possibleExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.webp'];
        
        for (const ext of possibleExtensions) {
            const fullPath = path.join(imagesDir, `${imageName}${ext}`);
            
            if (fs.existsSync(fullPath)) {
                try {
                    fs.unlinkSync(fullPath);
                    console.log(`Deleted: ${fullPath}`);
                    deletedCount++;
                } catch (err) {
                    console.error(`Error deleting ${fullPath}:`, err);
                    errorCount++;
                }
            }
        }
    }
    
    console.log(`\nSummary:`);
    console.log(`- Total defined items: ${allDefinedItems.size}`);
    console.log(`- Total image files: ${imageFiles.length}`);
    console.log(`- Unused images detected: ${unusedImages.length}`);
    console.log(`- Images successfully deleted: ${deletedCount}`);
    console.log(`- Errors encountered: ${errorCount}`);
}

// Run the script
cleanupUnusedImages();