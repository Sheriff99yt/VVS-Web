import { 
  SocketType, 
  SocketDirection, 
  createSocketDefinition, 
  areSocketsCompatible 
} from '../../sockets/types';

describe('Socket Types', () => {
  test('SocketType enum has correct values', () => {
    expect(SocketType.BOOLEAN).toBe('boolean');
    expect(SocketType.NUMBER).toBe('number');
    expect(SocketType.STRING).toBe('string');
    expect(SocketType.ANY).toBe('any');
    expect(SocketType.FLOW).toBe('flow');
  });

  test('SocketDirection enum has correct values', () => {
    expect(SocketDirection.INPUT).toBe('input');
    expect(SocketDirection.OUTPUT).toBe('output');
  });
});

describe('createSocketDefinition', () => {
  test('should create a socket definition with the correct values', () => {
    const socket = createSocketDefinition(
      'test-id',
      'Test Socket',
      SocketType.NUMBER,
      SocketDirection.INPUT,
      42
    );

    expect(socket).toEqual({
      id: 'test-id',
      name: 'Test Socket',
      type: SocketType.NUMBER,
      direction: SocketDirection.INPUT,
      defaultValue: 42
    });
  });

  test('should create a socket definition without defaultValue', () => {
    const socket = createSocketDefinition(
      'test-id',
      'Test Socket',
      SocketType.STRING,
      SocketDirection.OUTPUT
    );

    expect(socket).toEqual({
      id: 'test-id',
      name: 'Test Socket',
      type: SocketType.STRING,
      direction: SocketDirection.OUTPUT
    });
  });
});

describe('areSocketsCompatible', () => {
  const inputSocket = createSocketDefinition(
    'input-id',
    'Input Socket',
    SocketType.NUMBER,
    SocketDirection.INPUT
  );

  const outputSocket = createSocketDefinition(
    'output-id',
    'Output Socket',
    SocketType.NUMBER,
    SocketDirection.OUTPUT
  );

  const anyTypeSocket = createSocketDefinition(
    'any-id',
    'Any Type Socket',
    SocketType.ANY,
    SocketDirection.INPUT
  );

  const stringTypeOutputSocket = createSocketDefinition(
    'string-id',
    'String Socket',
    SocketType.STRING,
    SocketDirection.OUTPUT
  );

  test('should return false when sockets have the same direction', () => {
    const anotherInputSocket = createSocketDefinition(
      'another-input',
      'Another Input',
      SocketType.NUMBER,
      SocketDirection.INPUT
    );

    expect(areSocketsCompatible(inputSocket, anotherInputSocket)).toBe(false);
  });

  test('should return true when types match and directions are different', () => {
    expect(areSocketsCompatible(outputSocket, inputSocket)).toBe(true);
  });

  test('should return false when types mismatch and directions are different', () => {
    expect(areSocketsCompatible(stringTypeOutputSocket, inputSocket)).toBe(false);
  });

  test('should return true when one socket is ANY type', () => {
    expect(areSocketsCompatible(outputSocket, anyTypeSocket)).toBe(true);
    expect(areSocketsCompatible(stringTypeOutputSocket, anyTypeSocket)).toBe(true);
  });
}); 