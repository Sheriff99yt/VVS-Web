/**
 * CRACO configuration file
 * 
 * This file overrides the webpack configuration used by Create React App
 * to fix deprecation warnings and customize build settings.
 */

module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      // Fix deprecation warnings for dev server middleware options
      if (webpackConfig.devServer) {
        // Replace deprecated onBeforeSetupMiddleware and onAfterSetupMiddleware options
        const { onBeforeSetupMiddleware, onAfterSetupMiddleware, ...restDevServer } = webpackConfig.devServer;
        
        webpackConfig.devServer = {
          ...restDevServer,
          // Use setupMiddlewares instead of the deprecated options
          setupMiddlewares: (middlewares, devServer) => {
            if (onBeforeSetupMiddleware) {
              onBeforeSetupMiddleware(devServer);
            }
            
            // Apply middlewares
            
            if (onAfterSetupMiddleware) {
              onAfterSetupMiddleware(devServer);
            }
            
            return middlewares;
          }
        };
      }
      
      return webpackConfig;
    }
  }
}; 