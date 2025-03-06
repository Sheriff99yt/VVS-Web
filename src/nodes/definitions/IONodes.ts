/**
 * Input/Output Nodes
 * 
 * Defines all I/O nodes using the templates
 */

import { NodeType } from '../types';
import { SocketType } from '../../sockets/types';
import { 
  createPrintNode,
  createUserInputNode,
  registerPrintNode,
  registerUserInputNode,
  PrintNodeConfig as PrintConfig,
  UserInputNodeConfig as UserInputConfig
} from '../templates/IOTemplate';

// Print Node configuration
export const PrintNodeConfig: PrintConfig = {
  type: NodeType.PRINT,
  label: 'Print',
  description: 'Prints a message to the console or output device.',
  defaultMessage: 'Hello, World!'
};

// User Input Node configuration
export const UserInputNodeConfig: UserInputConfig = {
  type: NodeType.USER_INPUT,
  label: 'User Input',
  description: 'Reads input from the user with a prompt message.',
  defaultPrompt: 'Enter a value:',
  defaultVariable: 'userInput',
  outputType: SocketType.STRING
};

// Create nodes from configurations
export const PrintNode = createPrintNode(PrintNodeConfig);
export const UserInputNode = createUserInputNode(UserInputNodeConfig);

/**
 * Register all I/O nodes
 */
export function registerIONodes(): void {
  registerPrintNode(PrintNodeConfig);
  registerUserInputNode(UserInputNodeConfig);
  console.log('Registered I/O nodes');
} 