// Test script to validate JSONDataService functionality
// Run this in browser console to test data loading

(async function testDataService() {
  console.log('🧪 Testing JSONDataService...');
  
  try {
    // Import the JSONDataService
    const { JSONDataService } = await import('./src/lib/data/JSONDataService.js');
    const dataService = new JSONDataService();
    
    console.log('✅ JSONDataService imported successfully');
    
    // Test 1: Initialize service
    console.log('\n📋 Test 1: Initializing service...');
    await dataService.initialize();
    console.log('✅ Service initialized successfully');
    
    // Test 2: Load all lessons
    console.log('\n📚 Test 2: Loading lessons...');
    const lessons = await dataService.getLessons();
    console.log(`✅ Loaded ${lessons.length} lessons:`);
    lessons.forEach(lesson => {
      console.log(`  - ${lesson.title.fr} (${lesson.slug})`);
    });
    
    // Test 3: Get specific lesson
    console.log('\n📖 Test 3: Getting specific lesson...');
    if (lessons.length > 0) {
      const firstLesson = await dataService.getLesson(lessons[0].slug);
      console.log(`✅ Retrieved lesson: ${firstLesson.title.fr}`);
      console.log(`   Sections: ${firstLesson.sections.length}`);
      console.log(`   Duration: ${firstLesson.durationMin} minutes`);
    }
    
    // Test 4: Search functionality
    console.log('\n🔍 Test 4: Testing search...');
    const searchResults = await dataService.searchLessons('greetings');
    console.log(`✅ Search for 'greetings' returned ${searchResults.length} results`);
    
    // Test 5: Load media assets
    console.log('\n🎵 Test 5: Loading media assets...');
    const mediaAssets = await dataService.getMediaAssets();
    console.log(`✅ Loaded ${mediaAssets.length} media assets`);
    
    // Test 6: Load tags
    console.log('\n🏷️ Test 6: Loading tags...');
    const tags = await dataService.getTags();
    console.log(`✅ Loaded ${tags.length} tags:`);
    tags.slice(0, 5).forEach(tag => {
      console.log(`  - ${tag.name}`);
    });
    
    // Test 7: App settings
    console.log('\n⚙️ Test 7: Loading app settings...');
    const settings = await dataService.getAppSettings();
    console.log(`✅ Loaded ${Object.keys(settings).length} app settings`);
    
    console.log('\n🎉 All tests passed! JSONDataService is working correctly.');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    console.error('Stack trace:', error.stack);
  }
})();

// Also test individual data file loading
(async function testDataFiles() {
  console.log('\n🗂️ Testing individual data files...');
  
  const testFiles = [
    '/data/lessons/index.json',
    '/data/lessons/greetings-basics.json',
    '/data/media-assets.json',
    '/data/tags.json',
    '/data/app-settings.json'
  ];
  
  for (const file of testFiles) {
    try {
      const response = await fetch(file);
      if (response.ok) {
        const data = await response.json();
        console.log(`✅ ${file}: ${response.status} - ${Array.isArray(data) ? data.length + ' items' : 'object loaded'}`);
      } else {
        console.warn(`⚠️ ${file}: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.error(`❌ ${file}: ${error.message}`);
    }
  }
})();