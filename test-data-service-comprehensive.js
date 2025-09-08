// Comprehensive JSONDataService Test Script
// Run this in the browser console to validate all data service functionality

console.log('🧪 Starting comprehensive JSONDataService tests...');

// Import the data service (assuming it's available globally or via module)
const testDataService = async () => {
  try {
    // Test 1: Initialize and load all data
    console.log('\n📊 Test 1: Data Service Initialization');
    
    // Access the data service from the window object or import
    const { dataService } = await import('/src/lib/data/JSONDataService.js');
    
    // Test 2: Load all lessons
    console.log('\n📚 Test 2: Loading all lessons');
    const allLessons = await dataService.getLessons();
    console.log(`✅ Loaded ${allLessons.length} lessons:`, allLessons);
    
    if (allLessons.length === 0) {
      console.error('❌ No lessons loaded - check data files');
      return;
    }
    
    // Test 3: Get specific lesson by slug
    console.log('\n🎯 Test 3: Get lesson by slug');
    const firstLesson = allLessons[0];
    const lessonBySlug = await dataService.getLessonBySlug(firstLesson.slug);
    console.log(`✅ Retrieved lesson by slug '${firstLesson.slug}':`, lessonBySlug);
    
    // Test 4: Search functionality
    console.log('\n🔍 Test 4: Search functionality');
    const searchResults = await dataService.searchLessons('greeting');
    console.log(`✅ Search results for 'greeting':`, searchResults);
    
    // Test 5: Filter by level
    console.log('\n📈 Test 5: Filter by level');
    const beginnerLessons = await dataService.getLessons({ level: 'Beginner' });
    console.log(`✅ Beginner lessons:`, beginnerLessons);
    
    // Test 6: Load media assets
    console.log('\n🎵 Test 6: Load media assets');
    const mediaAsset = await dataService.getMediaAsset(1);
    console.log(`✅ Media asset with ID 1:`, mediaAsset);
    
    // Test 7: Load tags
    console.log('\n🏷️ Test 7: Load tags');
    const tags = await dataService.getTags();
    console.log(`✅ Loaded ${tags.length} tags:`, tags);
    
    // Test 8: Load app settings
    console.log('\n⚙️ Test 8: Load app settings');
    const appSettings = await dataService.getAppSettings();
    console.log(`✅ App settings:`, appSettings);
    
    // Test 9: User progress (mock)
    console.log('\n👤 Test 9: User progress functionality');
    const mockUserId = 1;
    const userProgress = await dataService.getUserProgress(mockUserId);
    console.log(`✅ User progress for user ${mockUserId}:`, userProgress);
    
    // Test 10: Lesson statistics
    console.log('\n📊 Test 10: Lesson statistics');
    const stats = await dataService.getLessonStats(mockUserId);
    console.log(`✅ Lesson statistics:`, stats);
    
    // Test 11: Data structure validation
    console.log('\n🔍 Test 11: Data structure validation');
    const sampleLesson = allLessons[0];
    console.log('Sample lesson structure:', {
      id: sampleLesson.id,
      slug: sampleLesson.slug,
      title: sampleLesson.title,
      level: sampleLesson.level,
      durationMin: sampleLesson.durationMin,
      sections: sampleLesson.sections?.length || 0,
      tags: sampleLesson.tags?.length || 0
    });
    
    // Validate required properties
    const requiredProps = ['id', 'slug', 'title', 'level', 'durationMin', 'sections'];
    const missingProps = requiredProps.filter(prop => !(prop in sampleLesson));
    
    if (missingProps.length > 0) {
      console.error(`❌ Missing required properties: ${missingProps.join(', ')}`);
    } else {
      console.log('✅ All required properties present');
    }
    
    // Test 12: Network requests validation
    console.log('\n🌐 Test 12: Network requests validation');
    const testUrls = [
      '/data/lessons/index.json',
      '/data/media-assets.json',
      '/data/tags.json',
      '/data/app-settings.json'
    ];
    
    for (const url of testUrls) {
      try {
        const response = await fetch(url);
        if (response.ok) {
          console.log(`✅ ${url} - Status: ${response.status}`);
        } else {
          console.error(`❌ ${url} - Status: ${response.status}`);
        }
      } catch (error) {
        console.error(`❌ ${url} - Error:`, error.message);
      }
    }
    
    console.log('\n🎉 All tests completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    console.error('Stack trace:', error.stack);
  }
};

// Run the tests
testDataService();

// Also test direct fetch calls
console.log('\n🔗 Testing direct data file access...');

fetch('/data/lessons/index.json')
  .then(response => {
    console.log('Lessons index response status:', response.status);
    return response.json();
  })
  .then(data => {
    console.log('Lessons index data:', data);
  })
  .catch(error => {
    console.error('Error fetching lessons index:', error);
  });

fetch('/data/lessons/greetings-basics.json')
  .then(response => {
    console.log('Sample lesson response status:', response.status);
    return response.json();
  })
  .then(data => {
    console.log('Sample lesson data structure:', {
      id: data.id,
      slug: data.slug,
      title: data.title,
      sectionsCount: data.sections?.length || 0
    });
  })
  .catch(error => {
    console.error('Error fetching sample lesson:', error);
  });