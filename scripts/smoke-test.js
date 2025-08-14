import('../api/index.js').then(() => {
    console.log('api index ok');
}).catch(error => {
    console.error('api index failed:', error.message);
});
