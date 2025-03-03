import { ExportService, ExportOptions } from '../../services/codeGen/ExportService';

// Mock the formatPythonCode function
jest.mock('../../utils/formatting', () => ({
  formatPythonCode: jest.fn((code) => `# Formatted code\n${code}`),
  adjustIndentation: jest.fn((code) => code),
}));

// Instead of trying to mock DOM APIs, we'll modify the ExportService class for testing
// by mocking the private downloadFile method
describe('ExportService', () => {
  let exportService: ExportService;
  
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Get a fresh instance for each test
    exportService = ExportService.getInstance();
    
    // Mock the private downloadFile method
    // @ts-ignore - Accessing private method for testing
    exportService.downloadFile = jest.fn().mockResolvedValue(undefined);
  });
  
  describe('getInstance', () => {
    it('should return a singleton instance', () => {
      const instance1 = ExportService.getInstance();
      const instance2 = ExportService.getInstance();
      
      expect(instance1).toBe(instance2);
    });
  });
  
  describe('exportPythonFile', () => {
    const testCode = 'def test():\n    print("Hello, world!")';
    const defaultOptions: ExportOptions = {
      fileName: 'test_file',
      includeTimestamp: false,
      addDocumentation: false,
      formatCode: false,
    };
    
    it('should prepare a file with the correct name and content', async () => {
      await exportService.exportPythonFile(testCode, defaultOptions);
      
      // Check if downloadFile was called with the right parameters
      // @ts-ignore - Accessing private method for testing
      expect(exportService.downloadFile).toHaveBeenCalledTimes(1);
      // @ts-ignore - Accessing private method for testing
      expect(exportService.downloadFile).toHaveBeenCalledWith(
        expect.any(String),
        'test_file.py',
        'text/plain'
      );
    });
    
    it('should format code when formatCode option is true', async () => {
      const options = { ...defaultOptions, formatCode: true };
      
      await exportService.exportPythonFile(testCode, options);
      
      // Verify the formatting was applied
      const { formatPythonCode } = require('../../utils/formatting');
      expect(formatPythonCode).toHaveBeenCalledWith(testCode);
    });
    
    it('should add documentation when addDocumentation option is true', async () => {
      const options = { ...defaultOptions, addDocumentation: true };
      
      await exportService.exportPythonFile(testCode, options);
      
      // We can't directly check the content, but we can verify the method completed
      // @ts-ignore - Accessing private method for testing
      expect(exportService.downloadFile).toHaveBeenCalledTimes(1);
    });
    
    it('should include timestamp in filename when includeTimestamp option is true', async () => {
      const options = { ...defaultOptions, includeTimestamp: true };
      
      // Mock Date.prototype.toISOString
      const originalToISOString = Date.prototype.toISOString;
      Date.prototype.toISOString = jest.fn().mockReturnValue('2023-01-01T12:00:00.000Z');
      
      await exportService.exportPythonFile(testCode, options);
      
      // Verify the timestamp was included in the filename
      // @ts-ignore - Accessing private method for testing
      expect(exportService.downloadFile).toHaveBeenCalledWith(
        expect.any(String),
        expect.stringContaining('test_file_2023-01-01T12-00-00-000Z.py'),
        'text/plain'
      );
      
      // Restore the original method
      Date.prototype.toISOString = originalToISOString;
    });
    
    it('should add .py extension if missing', async () => {
      const options = { ...defaultOptions, fileName: 'test_file_no_extension' };
      
      await exportService.exportPythonFile(testCode, options);
      
      // @ts-ignore - Accessing private method for testing
      expect(exportService.downloadFile).toHaveBeenCalledWith(
        expect.any(String),
        'test_file_no_extension.py',
        'text/plain'
      );
    });
    
    it('should handle errors gracefully', async () => {
      // Force an error by making downloadFile throw
      // @ts-ignore - Accessing private method for testing
      exportService.downloadFile = jest.fn().mockRejectedValue(new Error('Mock error'));
      
      // The method should reject with the error
      await expect(exportService.exportPythonFile(testCode, defaultOptions))
        .rejects.toThrow('Mock error');
    });
  });
}); 