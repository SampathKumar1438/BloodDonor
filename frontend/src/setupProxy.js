const { createProxyMiddleware } = require('http-proxy-middleware');

// This file is needed for React's development server to proxy API requests
// to our backend server running on port 5001
module.exports = function(app) {
  app.use(
    '/api',
    createProxyMiddleware({
      target: 'http://localhost:5001',
      changeOrigin: true, 
      secure: false,
      logLevel: 'debug',
      onError: (err, req, res) => {
        console.error('Proxy Error:', err);
        res.status(500).send('Proxy Error');
      },
    })
  );
};
