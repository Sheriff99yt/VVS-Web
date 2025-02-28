# Function Node Structure
 
## Language Examples
Here's how the same function looks across different languages. This example shows a function that takes an array of numbers, filters out negative numbers, doubles the remaining positive numbers, and returns the transformed array:

### Pseudocode
```
FUNCTION processArray(numbers: Array of Numbers) -> Array of Numbers
    IF numbers is empty THEN
        RETURN empty array
    END IF
    
    result = empty array
    FOR each number in numbers DO
        IF number > 0 THEN
            ADD (number * 2) to result
        END IF
    END FOR
    
    RETURN result
END FUNCTION
```

### Python
```python
def process_array(numbers: list[int]) -> list[int]:
    if not numbers:
        return []
    
    result = []
    for num in numbers:
        if num > 0:
            result.append(num * 2)
    
    return result
```

### C++
```cpp
#include <vector>

std::vector<int> processArray(const std::vector<int>& numbers) {
    if (numbers.empty()) {
        return std::vector<int>();
    }
    
    std::vector<int> result;
    for (const int& num : numbers) {
        if (num > 0) {
            result.push_back(num * 2);
        }
    }
    
    return result;
}
```

### JavaScript
```javascript
function processArray(numbers) {
    if (!numbers || numbers.length === 0) {
        return [];
    }
    
    return numbers
        .filter(num => num > 0)
        .map(num => num * 2);
}
```

### Rust
```rust
fn process_array(numbers: &Vec<i32>) -> Vec<i32> {
    if numbers.is_empty() {
        return Vec::new();
    }
    
    numbers
        .iter()
        .filter(|&&x| x > 0)
        .map(|&x| x * 2)
        .collect()
}
```

Key differences across languages:
1. **Type Declarations**:
   - Python: Optional type hints
   - C++: Explicit types required
   - JavaScript: No type declarations (TypeScript adds types)
   - Rust: Explicit types required

2. **Array/Vector Handling**:
   - Python: Dynamic lists
   - C++: Template-based vectors
   - JavaScript: Dynamic arrays
   - Rust: Vectors with ownership rules

3. **Function Declaration**:
   - Python: Uses `def` keyword
   - C++: Return type before name
   - JavaScript: Uses `function` keyword
   - Rust: Uses `fn` keyword

4. **Memory Management**:
   - Python: Automatic garbage collection
   - C++: Manual memory management (RAII)
   - JavaScript: Automatic garbage collection
   - Rust: Ownership system


### Function Structure
```
[Access Modifier] [Static?] [Async?] [ReturnType] [Name]([Parameters]) [Throws?] [Body Prefix] {
    // Input Validation
    [Parameter Validation]
    
    // Function Implementation
    [Body/Logic]
    
    // Multiple return points possible
    if ([condition]) {
        return [Value1];
    }
    
    // Default return
    return [Value2];
} [Body Suffix] [ErrorHandling?]
```

### Function Components Table

| Component | Description | Examples | Optional? |
|-----------|-------------|----------|-----------|
| Access Modifier | Controls visibility of the function | `public`, `private`, `protected` | Yes |
| Static | Indicates if function belongs to class itself | `static`, `class` | Yes |
| Async | Marks function as asynchronous | `async`, `async def` | Yes |
| ReturnType | Type of value function returns | `void`, `int`, `Promise<T>` | No |
| Name | Function identifier | `processData`, `calculateSum` | No |
| Parameters | Input values with types | `(id: number, data: string)` | Yes |
| Throws | Declares possible exceptions | `throws Exception`, `raises Error` | Yes |
| Body Prefix | Language-specific prefix | `{`, `:`, `do` | No |
| Parameter Validation | Input checking code | `if (!data) throw Error()` | Yes |
| Body/Logic | Main function implementation | Business logic, calculations | No |
| Condition | Logic for return decision | `if (value > 0)`, `while (true)` | Yes |
| Value1/Value2 | Return values | `return result`, `return null` | No* |
| Body Suffix | Language-specific suffix | `}`, `end`, `done` | No |
| ErrorHandling | Error management code | `try/catch`, `rescue` | Yes |

*At least one return value is required for non-void functions


### Example Implementation
```typescript
public static async function processData(
    data: InputType[],
    options?: ProcessOptions
): Promise<OutputType> throws ProcessError {
    // Input validation
    if (!data || data.length === 0) {
        throw new ProcessError("Empty input data");
    }
    
    // Initialize result
    let result: OutputType;
    
    try {
        // Core processing
        result = await transformData(data, options);
        
        // Validation of result
        if (!isValidOutput(result)) {
            throw new ProcessError("Invalid output");
        }
        
        // Success case
        return result;
        
    } catch (error) {
        // Error handling
        logger.error("Processing failed:", error);
        throw new ProcessError("Failed to process data", error);
    }
}
```

### Visual Representation
```
┌─────────────────────────────────────┐
│           Function Header           │
├─────────────────────────────────────┤
│           Function Body             │
├─────────────────────────────────────┤
│ ┌─────────────────────────────────┐ │
│ │            Output 2             │ │
│ │─────────────────────────────────│ │
│ │            Output 1             │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
``` 