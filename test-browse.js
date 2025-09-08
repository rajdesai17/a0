// Simple test script to verify browse tool functionality
const { browseTool } = require('./lib/tools/browseTool');

async function testBrowseTool() {
  console.log('🧪 Testing browse tool functionality...');
  
  try {
    const result = await browseTool({ 
      urls: ['https://jsonplaceholder.typicode.com/'] 
    });
    
    console.log('✅ Browse tool test result:');
    console.log('Success:', result.success);
    console.log('Message:', result.message);
    console.log('Summary:', JSON.stringify(result.summary, null, 2));
    console.log('Results count:', result.results.length);
    
    if (result.results.length > 0) {
      const firstResult = result.results[0];
      console.log('\n📄 First result analysis:');
      console.log('URL:', firstResult.url);
      console.log('Success:', firstResult.success);
      console.log('Title:', firstResult.title);
      console.log('API Endpoints count:', firstResult.apiEndpoints?.length || 0);
      console.log('Word count:', firstResult.wordCount);
      
      if (firstResult.analysis) {
        console.log('\n🔍 Analysis summary:');
        console.log(firstResult.analysis.summary);
        console.log('Auth methods:', firstResult.analysis.authMethods?.length || 0);
        console.log('Common patterns:', firstResult.analysis.commonPatterns?.length || 0);
      }
    }
    
    console.log('\n✅ Browse tool test completed successfully!');
    
  } catch (error) {
    console.error('❌ Browse tool test failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

testBrowseTool();
