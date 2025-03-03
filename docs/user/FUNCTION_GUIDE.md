# VVS Web Function Reference Guide

This guide provides a comprehensive reference for all the functions available in VVS Web. Functions are organized by category for easy navigation.

## Table of Contents

1. [Math Functions](#math-functions)
2. [String Functions](#string-functions)
3. [List Functions](#list-functions)
4. [Dictionary Functions](#dictionary-functions)
5. [Control Flow Functions](#control-flow-functions)
6. [Input/Output Functions](#inputoutput-functions)
7. [Comparison Functions](#comparison-functions)
8. [Type Conversion Functions](#type-conversion-functions)
9. [File Operations](#file-operations)
10. [Date and Time Functions](#date-and-time-functions)

## Math Functions

### Add
- **Description**: Adds two numbers together
- **Inputs**: 
  - a (number): First number
  - b (number): Second number
- **Output**: result (number): Sum of a and b
- **Example**: `5 + 3 = 8`

### Subtract
- **Description**: Subtracts the second number from the first
- **Inputs**: 
  - a (number): Number to subtract from
  - b (number): Number to subtract
- **Output**: result (number): Difference of a and b
- **Example**: `5 - 3 = 2`

### Multiply
- **Description**: Multiplies two numbers
- **Inputs**: 
  - a (number): First number
  - b (number): Second number
- **Output**: result (number): Product of a and b
- **Example**: `5 * 3 = 15`

### Divide
- **Description**: Divides the first number by the second
- **Inputs**: 
  - a (number): Numerator
  - b (number): Denominator
- **Output**: result (number): Quotient of a and b
- **Example**: `6 / 3 = 2`

### Modulo
- **Description**: Returns the remainder after division
- **Inputs**: 
  - a (number): Dividend
  - b (number): Divisor
- **Output**: result (number): Remainder of a divided by b
- **Example**: `7 % 3 = 1`

### Power
- **Description**: Raises the first number to the power of the second
- **Inputs**: 
  - base (number): The base number
  - exponent (number): The exponent
- **Output**: result (number): base raised to the power of exponent
- **Example**: `2 ^ 3 = 8`

### Square Root
- **Description**: Calculates the square root of a number
- **Inputs**: 
  - number (number): The input number
- **Output**: result (number): Square root of the input
- **Example**: `sqrt(9) = 3`

### Absolute Value
- **Description**: Returns the absolute value of a number
- **Inputs**: 
  - number (number): The input number
- **Output**: result (number): Absolute value of the input
- **Example**: `abs(-5) = 5`

### Round
- **Description**: Rounds a number to the nearest integer
- **Inputs**: 
  - number (number): The input number
- **Output**: result (number): Rounded value
- **Example**: `round(3.7) = 4`

### Floor
- **Description**: Rounds a number down to the nearest integer
- **Inputs**: 
  - number (number): The input number
- **Output**: result (number): Floor value
- **Example**: `floor(3.7) = 3`

### Ceiling
- **Description**: Rounds a number up to the nearest integer
- **Inputs**: 
  - number (number): The input number
- **Output**: result (number): Ceiling value
- **Example**: `ceil(3.2) = 4`

## String Functions

### Concatenate
- **Description**: Joins two strings together
- **Inputs**: 
  - a (string): First string
  - b (string): Second string
- **Output**: result (string): Combined string
- **Example**: `"Hello" + " World" = "Hello World"`

### Substring
- **Description**: Extracts a portion of a string
- **Inputs**: 
  - string (string): Source string
  - start (number): Starting index
  - length (number): Number of characters to extract
- **Output**: result (string): Extracted substring
- **Example**: `substring("Hello World", 0, 5) = "Hello"`

### Length
- **Description**: Returns the length of a string
- **Inputs**: 
  - string (string): Input string
- **Output**: result (number): Number of characters
- **Example**: `length("Hello") = 5`

### To Uppercase
- **Description**: Converts a string to uppercase
- **Inputs**: 
  - string (string): Input string
- **Output**: result (string): Uppercase string
- **Example**: `toUppercase("hello") = "HELLO"`

### To Lowercase
- **Description**: Converts a string to lowercase
- **Inputs**: 
  - string (string): Input string
- **Output**: result (string): Lowercase string
- **Example**: `toLowercase("HELLO") = "hello"`

### Format String
- **Description**: Creates a formatted string with placeholders
- **Inputs**: 
  - template (string): String with placeholders {0}, {1}, etc.
  - values (any[]): Values to insert into placeholders
- **Output**: result (string): Formatted string
- **Example**: `format("Hello, {0}!", ["World"]) = "Hello, World!"`

### Split
- **Description**: Splits a string into a list based on a delimiter
- **Inputs**: 
  - string (string): String to split
  - delimiter (string): Character to split on
- **Output**: result (list): List of substrings
- **Example**: `split("a,b,c", ",") = ["a", "b", "c"]`

### Trim
- **Description**: Removes whitespace from the beginning and end of a string
- **Inputs**: 
  - string (string): Input string
- **Output**: result (string): Trimmed string
- **Example**: `trim("  hello  ") = "hello"`

### Replace
- **Description**: Replaces occurrences of a substring with another
- **Inputs**: 
  - string (string): Original string
  - search (string): Substring to find
  - replace (string): Replacement string
- **Output**: result (string): Modified string
- **Example**: `replace("hello world", "world", "friend") = "hello friend"`

## List Functions

### Create List
- **Description**: Creates a new list with the given items
- **Inputs**: 
  - items (any[]): Items to include in the list
- **Output**: result (list): New list
- **Example**: `createList(1, 2, 3) = [1, 2, 3]`

### Append
- **Description**: Adds an item to the end of a list
- **Inputs**: 
  - list (list): Target list
  - item (any): Item to append
- **Output**: result (list): Modified list
- **Example**: `append([1, 2], 3) = [1, 2, 3]`

### Get Item
- **Description**: Retrieves an item from a list at the specified index
- **Inputs**: 
  - list (list): Source list
  - index (number): Index of the item
- **Output**: result (any): Item at the specified index
- **Example**: `getItem([1, 2, 3], 1) = 2`

### Set Item
- **Description**: Changes an item in a list at the specified index
- **Inputs**: 
  - list (list): Target list
  - index (number): Index to modify
  - value (any): New value
- **Output**: result (list): Modified list
- **Example**: `setItem([1, 2, 3], 1, 5) = [1, 5, 3]`

### Remove Item
- **Description**: Removes an item at the specified index
- **Inputs**: 
  - list (list): Target list
  - index (number): Index to remove
- **Output**: result (list): Modified list
- **Example**: `removeItem([1, 2, 3], 1) = [1, 3]`

### Length
- **Description**: Returns the number of items in a list
- **Inputs**: 
  - list (list): Input list
- **Output**: result (number): Number of items
- **Example**: `length([1, 2, 3]) = 3`

### Join
- **Description**: Combines list items into a string with a delimiter
- **Inputs**: 
  - list (list): List of items
  - delimiter (string): Separator between items
- **Output**: result (string): Combined string
- **Example**: `join([1, 2, 3], ", ") = "1, 2, 3"`

### Slice
- **Description**: Extracts a portion of a list
- **Inputs**: 
  - list (list): Source list
  - start (number): Starting index
  - end (number): Ending index (exclusive)
- **Output**: result (list): Extracted sublist
- **Example**: `slice([1, 2, 3, 4], 1, 3) = [2, 3]`

### Sort
- **Description**: Sorts a list in ascending order
- **Inputs**: 
  - list (list): List to sort
- **Output**: result (list): Sorted list
- **Example**: `sort([3, 1, 2]) = [1, 2, 3]`

### Reverse
- **Description**: Reverses the order of items in a list
- **Inputs**: 
  - list (list): List to reverse
- **Output**: result (list): Reversed list
- **Example**: `reverse([1, 2, 3]) = [3, 2, 1]`

## Dictionary Functions

### Create Dictionary
- **Description**: Creates a new dictionary with the given key-value pairs
- **Inputs**: 
  - keys (list): List of keys
  - values (list): List of values
- **Output**: result (dictionary): New dictionary
- **Example**: `createDict(["a", "b"], [1, 2]) = {"a": 1, "b": 2}`

### Get Value
- **Description**: Retrieves a value from a dictionary using its key
- **Inputs**: 
  - dictionary (dictionary): Source dictionary
  - key (any): Key to look up
- **Output**: result (any): Value associated with the key
- **Example**: `getValue({"a": 1, "b": 2}, "a") = 1`

### Set Value
- **Description**: Sets a value in a dictionary for the specified key
- **Inputs**: 
  - dictionary (dictionary): Target dictionary
  - key (any): Key to set
  - value (any): Value to associate with the key
- **Output**: result (dictionary): Modified dictionary
- **Example**: `setValue({"a": 1}, "b", 2) = {"a": 1, "b": 2}`

### Remove Key
- **Description**: Removes a key-value pair from a dictionary
- **Inputs**: 
  - dictionary (dictionary): Target dictionary
  - key (any): Key to remove
- **Output**: result (dictionary): Modified dictionary
- **Example**: `removeKey({"a": 1, "b": 2}, "a") = {"b": 2}`

### Has Key
- **Description**: Checks if a dictionary contains a specific key
- **Inputs**: 
  - dictionary (dictionary): Dictionary to check
  - key (any): Key to look for
- **Output**: result (boolean): True if the key exists, false otherwise
- **Example**: `hasKey({"a": 1, "b": 2}, "c") = false`

### Keys
- **Description**: Returns a list of all keys in a dictionary
- **Inputs**: 
  - dictionary (dictionary): Source dictionary
- **Output**: result (list): List of keys
- **Example**: `keys({"a": 1, "b": 2}) = ["a", "b"]`

### Values
- **Description**: Returns a list of all values in a dictionary
- **Inputs**: 
  - dictionary (dictionary): Source dictionary
- **Output**: result (list): List of values
- **Example**: `values({"a": 1, "b": 2}) = [1, 2]`

## Control Flow Functions

### If Statement
- **Description**: Executes one of two branches based on a condition
- **Inputs**: 
  - condition (boolean): The condition to evaluate
  - then (execution): Code to execute if condition is true
  - else (execution): Code to execute if condition is false
- **Output**: None (execution flow only)
- **Example**: `if x > 0: print("Positive") else: print("Non-positive")`

### For Loop
- **Description**: Iterates over a collection
- **Inputs**: 
  - collection (list/string): Items to iterate over
  - body (execution): Code to execute for each item
  - completed (execution): Code to execute after the loop
- **Output**: item (any): Current item in each iteration
- **Example**: `for item in [1, 2, 3]: print(item)`

### While Loop
- **Description**: Repeats code while a condition is true
- **Inputs**: 
  - condition (boolean): Condition to check before each iteration
  - body (execution): Code to execute while condition is true
  - completed (execution): Code to execute after the loop
- **Output**: None (execution flow only)
- **Example**: `while count < 5: print(count); count += 1`

### Define Function
- **Description**: Creates a reusable function
- **Inputs**: 
  - name (string): Function name
  - parameters (list): Parameter names
  - body (execution): Function body
  - after (execution): Code to execute after the function definition
- **Output**: None (execution flow only)
- **Example**: `def add(a, b): return a + b`

### Return
- **Description**: Returns a value from a function
- **Inputs**: 
  - value (any): Value to return
- **Output**: None (execution flow only)
- **Example**: `return result`

### Break
- **Description**: Exits a loop early
- **Inputs**: None
- **Output**: None (execution flow only)
- **Example**: `if condition: break`

### Continue
- **Description**: Skips to the next iteration of a loop
- **Inputs**: None
- **Output**: None (execution flow only)
- **Example**: `if condition: continue`

## Input/Output Functions

### Number Input
- **Description**: Gets a number from the user
- **Inputs**: 
  - prompt (string): Message to display to the user
  - default (number, optional): Default value
- **Output**: result (number): User input as a number
- **Example**: `input("Enter a number: ")`

### String Input
- **Description**: Gets a string from the user
- **Inputs**: 
  - prompt (string): Message to display to the user
  - default (string, optional): Default value
- **Output**: result (string): User input as a string
- **Example**: `input("Enter your name: ")`

### Print
- **Description**: Displays a value to the user
- **Inputs**: 
  - value (any): Value to display
- **Output**: None (execution flow only)
- **Example**: `print("Hello, World!")`

### Format Output
- **Description**: Formats and displays multiple values
- **Inputs**: 
  - template (string): Format string with placeholders
  - values (list): Values to insert into the template
- **Output**: None (execution flow only)
- **Example**: `print(f"Name: {name}, Age: {age}")`

## Comparison Functions

### Equal
- **Description**: Checks if two values are equal
- **Inputs**: 
  - a (any): First value
  - b (any): Second value
- **Output**: result (boolean): True if equal, false otherwise
- **Example**: `5 == 5`

### Not Equal
- **Description**: Checks if two values are not equal
- **Inputs**: 
  - a (any): First value
  - b (any): Second value
- **Output**: result (boolean): True if not equal, false otherwise
- **Example**: `5 != 3`

### Greater Than
- **Description**: Checks if the first value is greater than the second
- **Inputs**: 
  - a (number): First value
  - b (number): Second value
- **Output**: result (boolean): True if a > b, false otherwise
- **Example**: `5 > 3`

### Less Than
- **Description**: Checks if the first value is less than the second
- **Inputs**: 
  - a (number): First value
  - b (number): Second value
- **Output**: result (boolean): True if a < b, false otherwise
- **Example**: `3 < 5`

### Greater Than or Equal
- **Description**: Checks if the first value is greater than or equal to the second
- **Inputs**: 
  - a (number): First value
  - b (number): Second value
- **Output**: result (boolean): True if a >= b, false otherwise
- **Example**: `5 >= 5`

### Less Than or Equal
- **Description**: Checks if the first value is less than or equal to the second
- **Inputs**: 
  - a (number): First value
  - b (number): Second value
- **Output**: result (boolean): True if a <= b, false otherwise
- **Example**: `5 <= 5`

### And
- **Description**: Logical AND of two boolean values
- **Inputs**: 
  - a (boolean): First value
  - b (boolean): Second value
- **Output**: result (boolean): True if both inputs are true
- **Example**: `true and true = true`

### Or
- **Description**: Logical OR of two boolean values
- **Inputs**: 
  - a (boolean): First value
  - b (boolean): Second value
- **Output**: result (boolean): True if either input is true
- **Example**: `true or false = true`

### Not
- **Description**: Logical NOT of a boolean value
- **Inputs**: 
  - value (boolean): Input value
- **Output**: result (boolean): Opposite of the input
- **Example**: `not true = false`

## Type Conversion Functions

### To String
- **Description**: Converts a value to a string
- **Inputs**: 
  - value (any): Value to convert
- **Output**: result (string): String representation
- **Example**: `toString(42) = "42"`

### To Number
- **Description**: Converts a value to a number
- **Inputs**: 
  - value (any): Value to convert
- **Output**: result (number): Numeric representation
- **Example**: `toNumber("42") = 42`

### To Boolean
- **Description**: Converts a value to a boolean
- **Inputs**: 
  - value (any): Value to convert
- **Output**: result (boolean): Boolean representation
- **Example**: `toBoolean(1) = true`

### To List
- **Description**: Converts a value to a list
- **Inputs**: 
  - value (any): Value to convert
- **Output**: result (list): List representation
- **Example**: `toList("abc") = ["a", "b", "c"]`

## File Operations

### Read File
- **Description**: Reads the contents of a file
- **Inputs**: 
  - path (string): Path to the file
- **Output**: result (string): File contents
- **Example**: `readFile("data.txt")`

### Write File
- **Description**: Writes content to a file
- **Inputs**: 
  - path (string): Path to the file
  - content (string): Content to write
- **Output**: None (execution flow only)
- **Example**: `writeFile("output.txt", "Hello, World!")`

### Append to File
- **Description**: Appends content to the end of a file
- **Inputs**: 
  - path (string): Path to the file
  - content (string): Content to append
- **Output**: None (execution flow only)
- **Example**: `appendFile("log.txt", "New entry")`

### File Exists
- **Description**: Checks if a file exists
- **Inputs**: 
  - path (string): Path to check
- **Output**: result (boolean): True if the file exists
- **Example**: `fileExists("data.txt")`

## Date and Time Functions

### Current Date
- **Description**: Gets the current date
- **Inputs**: None
- **Output**: result (date): Current date
- **Example**: `currentDate()`

### Current Time
- **Description**: Gets the current time
- **Inputs**: None
- **Output**: result (time): Current time
- **Example**: `currentTime()`

### Format Date
- **Description**: Formats a date as a string
- **Inputs**: 
  - date (date): Date to format
  - format (string): Format string
- **Output**: result (string): Formatted date string
- **Example**: `formatDate(date, "YYYY-MM-DD")`

### Parse Date
- **Description**: Converts a string to a date
- **Inputs**: 
  - string (string): Date string
  - format (string): Format of the date string
- **Output**: result (date): Parsed date
- **Example**: `parseDate("2023-01-01", "YYYY-MM-DD")`

### Date Add
- **Description**: Adds a duration to a date
- **Inputs**: 
  - date (date): Starting date
  - amount (number): Amount to add
  - unit (string): Unit (days, months, years, etc.)
- **Output**: result (date): New date
- **Example**: `dateAdd(date, 5, "days")` 