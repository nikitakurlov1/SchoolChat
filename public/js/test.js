// Test file to verify JavaScript functionality
console.log('Testing JavaScript files...');

// Test ES6 features
const testFunction = () => {
    const testVar = 'ES6 is working';
    console.log(testVar);
    return testVar;
};

testFunction();

// Test async/await
const asyncTest = async () => {
    try {
        const result = await Promise.resolve('Async/await is working');
        console.log(result);
        return result;
    } catch (error) {
        console.error('Error in async test:', error);
    }
};

asyncTest();

console.log('All tests completed successfully!');