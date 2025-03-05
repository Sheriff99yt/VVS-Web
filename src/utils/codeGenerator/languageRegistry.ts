import { LanguageConfig } from '../languageConfig';
import { pythonConfig, typeScriptConfig, cppConfig } from '../languageConfig';
import { javaConfig } from '../languageConfigs/java';
import { goConfig } from '../languageConfigs/go';

/**
 * Registry for language configurations
 * Manages all available language configurations for code generation
 */
export class LanguageRegistry {
  private static configurations: Record<string, LanguageConfig> = {};
  private static initialized: boolean = false;
  
  /**
   * Initialize the registry with default languages
   */
  static initialize(): void {
    if (this.initialized) return;
    
    // Register default languages
    this.register(pythonConfig);
    this.register(typeScriptConfig);
    this.register(cppConfig);
    this.register(javaConfig);
    this.register(goConfig);
    
    this.initialized = true;
  }
  
  /**
   * Register a language configuration
   * @param config The language configuration to register
   */
  static register(config: LanguageConfig): void {
    const normalizedName = config.name.toLowerCase();
    this.configurations[normalizedName] = config;
  }
  
  /**
   * Get a language configuration by name
   * @param language The language name
   * @returns The language configuration or undefined if not found
   */
  static getConfig(language: string): LanguageConfig | undefined {
    if (!this.initialized) this.initialize();
    
    const normalizedName = language.toLowerCase();
    return this.configurations[normalizedName];
  }
  
  /**
   * Get a language configuration by name, with fallback to Python
   * @param language The language name
   * @returns The language configuration or Python config if not found
   */
  static getConfigWithFallback(language: string): LanguageConfig {
    const config = this.getConfig(language);
    return config || this.getConfig('python') || pythonConfig;
  }
  
  /**
   * Get all available language names
   * @returns Array of available language names
   */
  static getAvailableLanguages(): string[] {
    if (!this.initialized) this.initialize();
    
    return Object.values(this.configurations).map(config => config.name);
  }
  
  /**
   * Check if a language is supported
   * @param language The language name to check
   * @returns True if the language is supported, false otherwise
   */
  static isLanguageSupported(language: string): boolean {
    if (!this.initialized) this.initialize();
    
    const normalizedName = language.toLowerCase();
    return normalizedName in this.configurations;
  }
}

// Initialize the registry
LanguageRegistry.initialize(); 