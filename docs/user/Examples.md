# VVS Web Examples

This document provides practical examples of programs you can create with VVS Web. Each example includes a description, a visual representation of the node graph, and the generated Python code.

## Table of Contents

1. [Simple Calculator](#simple-calculator)
2. [Temperature Converter](#temperature-converter)
3. [String Manipulator](#string-manipulator)
4. [List Processor](#list-processor)
5. [Conditional Logic](#conditional-logic)
6. [Loops and Iteration](#loops-and-iteration)
7. [File Operations](#file-operations)
8. [Function Definition](#function-definition)

## Simple Calculator

### Description
A basic calculator that performs addition, subtraction, multiplication, and division on two numbers.

### Node Graph
```
[Number Input 1] ──┐
                   ├─→ [Operation Selector] ──→ [Result Display]
[Number Input 2] ──┘
```

### Generated Python Code
```python
# Simple Calculator
num1 = float(input("Enter first number: "))
num2 = float(input("Enter second number: "))
operation = input("Enter operation (+, -, *, /): ")

result = None
if operation == "+":
    result = num1 + num2
elif operation == "-":
    result = num1 - num2
elif operation == "*":
    result = num1 * num2
elif operation == "/":
    if num2 != 0:
        result = num1 / num2
    else:
        print("Error: Division by zero")
else:
    print("Invalid operation")

if result is not None:
    print(f"Result: {result}")
```

## Temperature Converter

### Description
Converts temperatures between Celsius and Fahrenheit.

### Node Graph
```
[Temperature Input] ──→ [Unit Selector] ──→ [Conversion Formula] ──→ [Result Display]
```

### Generated Python Code
```python
# Temperature Converter
temp = float(input("Enter temperature: "))
unit = input("Enter unit (C for Celsius, F for Fahrenheit): ").upper()

if unit == "C":
    # Convert Celsius to Fahrenheit
    converted = (temp * 9/5) + 32
    print(f"{temp}°C = {converted}°F")
elif unit == "F":
    # Convert Fahrenheit to Celsius
    converted = (temp - 32) * 5/9
    print(f"{temp}°F = {converted}°C")
else:
    print("Invalid unit. Please enter C or F.")
```

## String Manipulator

### Description
Performs various operations on a string, such as counting characters, converting case, and finding substrings.

### Node Graph
```
[String Input] ──→ [Operation Selector] ──┬─→ [Length Counter] ───┐
                                          ├─→ [Case Converter] ───┼─→ [Result Display]
                                          └─→ [Substring Finder] ─┘
```

### Generated Python Code
```python
# String Manipulator
text = input("Enter a string: ")
operation = input("Choose operation (length, upper, lower, find): ").lower()

if operation == "length":
    result = len(text)
    print(f"Length of string: {result}")
elif operation == "upper":
    result = text.upper()
    print(f"Uppercase: {result}")
elif operation == "lower":
    result = text.lower()
    print(f"Lowercase: {result}")
elif operation == "find":
    substring = input("Enter substring to find: ")
    position = text.find(substring)
    if position >= 0:
        print(f"'{substring}' found at position {position}")
    else:
        print(f"'{substring}' not found in the string")
else:
    print("Invalid operation")
```

## List Processor

### Description
Creates and manipulates lists with operations like adding items, removing items, sorting, and finding values.

### Node Graph
```
[List Input] ──→ [Operation Selector] ──┬─→ [Add Item] ───────┐
                                        ├─→ [Remove Item] ────┤
                                        ├─→ [Sort List] ──────┼─→ [Result Display]
                                        └─→ [Find Item] ──────┘
```

### Generated Python Code
```python
# List Processor
input_list = input("Enter comma-separated list items: ")
items = [item.strip() for item in input_list.split(",")]
print(f"Current list: {items}")

operation = input("Choose operation (add, remove, sort, find): ").lower()

if operation == "add":
    new_item = input("Enter item to add: ")
    items.append(new_item)
    print(f"Updated list: {items}")
elif operation == "remove":
    remove_item = input("Enter item to remove: ")
    if remove_item in items:
        items.remove(remove_item)
        print(f"Updated list: {items}")
    else:
        print(f"'{remove_item}' not found in the list")
elif operation == "sort":
    try:
        items.sort()
        print(f"Sorted list: {items}")
    except TypeError:
        print("List contains mixed types that cannot be sorted")
elif operation == "find":
    find_item = input("Enter item to find: ")
    if find_item in items:
        position = items.index(find_item)
        print(f"'{find_item}' found at position {position}")
    else:
        print(f"'{find_item}' not found in the list")
else:
    print("Invalid operation")
```

## Conditional Logic

### Description
Demonstrates conditional logic with a simple age verification program.

### Node Graph
```
[Age Input] ──→ [Age Comparison] ──→ [If Statement] ──┬─→ [Adult Message] ───┐
                                                      └─→ [Minor Message] ───┘
```

### Generated Python Code
```python
# Age Verification
age = int(input("Enter your age: "))

if age >= 18:
    print("You are an adult.")
    print("You are eligible to vote.")
else:
    print("You are a minor.")
    years_left = 18 - age
    print(f"You will be eligible to vote in {years_left} years.")
```

## Loops and Iteration

### Description
Shows how to use loops to process collections of data, with a simple number summation example.

### Node Graph
```
[Number List Input] ──→ [For Loop] ──→ [Sum Calculation] ──→ [Result Display]
                           │
                           └─→ [Current Item] ──→ [Add to Sum]
```

### Generated Python Code
```python
# Number Summation
input_numbers = input("Enter comma-separated numbers: ")
numbers = [float(num.strip()) for num in input_numbers.split(",")]

total = 0
for number in numbers:
    total += number

print(f"Sum of numbers: {total}")
print(f"Average: {total / len(numbers) if numbers else 0}")
```

## File Operations

### Description
Demonstrates reading from and writing to files.

### Node Graph
```
[Filename Input] ──→ [Operation Selector] ──┬─→ [Read File] ───┐
                                            └─→ [Write File] ──┘
                                                    ↑
                                            [Content Input]
```

### Generated Python Code
```python
# File Operations
filename = input("Enter filename: ")
operation = input("Choose operation (read, write): ").lower()

if operation == "read":
    try:
        with open(filename, 'r') as file:
            content = file.read()
            print("File content:")
            print(content)
    except FileNotFoundError:
        print(f"Error: File '{filename}' not found")
    except Exception as e:
        print(f"Error reading file: {e}")
elif operation == "write":
    content = input("Enter content to write: ")
    try:
        with open(filename, 'w') as file:
            file.write(content)
            print(f"Content successfully written to '{filename}'")
    except Exception as e:
        print(f"Error writing to file: {e}")
else:
    print("Invalid operation")
```

## Function Definition

### Description
Shows how to define and use a custom function.

### Node Graph
```
[Function Definition] ──→ [After Function]
        │
        └─→ [Function Body]
                │
                └─→ [Parameter Processing] ──→ [Return Result]
```

### Generated Python Code
```python
# Function Definition and Usage
def calculate_area(shape, *dimensions):
    """Calculate the area of different shapes."""
    if shape.lower() == "rectangle":
        if len(dimensions) != 2:
            return "Error: Rectangle requires length and width"
        length, width = dimensions
        return length * width
    elif shape.lower() == "circle":
        if len(dimensions) != 1:
            return "Error: Circle requires radius"
        radius = dimensions[0]
        import math
        return math.pi * radius ** 2
    elif shape.lower() == "triangle":
        if len(dimensions) != 2:
            return "Error: Triangle requires base and height"
        base, height = dimensions
        return 0.5 * base * height
    else:
        return "Error: Unsupported shape"

# Test the function
print(calculate_area("rectangle", 5, 4))  # 20
print(calculate_area("circle", 3))        # ~28.27
print(calculate_area("triangle", 6, 8))   # 24
```

## Creating a To-Do List Application

### Description
A more complex example that creates a simple to-do list application with add, view, and complete functionality.

### Node Graph
```
[Main Menu] ──→ [Operation Selector] ──┬─→ [Add Task] ───────┐
                                        ├─→ [View Tasks] ────┼─→ [Return to Menu]
                                        ├─→ [Complete Task] ─┤
                                        └─→ [Exit Program] ──┘
```

### Generated Python Code
```python
# To-Do List Application
def display_menu():
    print("\n==== To-Do List ====")
    print("1. Add Task")
    print("2. View Tasks")
    print("3. Complete Task")
    print("4. Exit")
    return input("Choose an option (1-4): ")

def add_task(tasks):
    task = input("Enter task description: ")
    tasks.append({"description": task, "completed": False})
    print(f"Task '{task}' added successfully!")

def view_tasks(tasks):
    if not tasks:
        print("No tasks in the list.")
        return
    
    print("\nYour Tasks:")
    for i, task in enumerate(tasks):
        status = "✓" if task["completed"] else " "
        print(f"{i+1}. [{status}] {task['description']}")

def complete_task(tasks):
    if not tasks:
        print("No tasks in the list.")
        return
    
    view_tasks(tasks)
    try:
        task_num = int(input("\nEnter task number to mark as completed: "))
        if 1 <= task_num <= len(tasks):
            tasks[task_num-1]["completed"] = True
            print(f"Task '{tasks[task_num-1]['description']}' marked as completed!")
        else:
            print("Invalid task number.")
    except ValueError:
        print("Please enter a valid number.")

# Main program
tasks = []
while True:
    choice = display_menu()
    
    if choice == "1":
        add_task(tasks)
    elif choice == "2":
        view_tasks(tasks)
    elif choice == "3":
        complete_task(tasks)
    elif choice == "4":
        print("Goodbye!")
        break
    else:
        print("Invalid option. Please try again.")
```

## Next Steps

These examples demonstrate the basic capabilities of VVS Web. You can combine these concepts to create more complex applications. Here are some ideas for projects you might want to try:

1. A budget tracker that records expenses and calculates totals
2. A simple text-based game with user choices
3. A data analysis tool that processes CSV files
4. A password generator with customizable options
5. A quiz application that keeps score

Remember that you can always refer to the [Function Reference](./FUNCTION_GUIDE.md) for details on all available functions in VVS Web.
