# Building a Simple Calculator in VVS Web

This tutorial will guide you through creating a simple calculator application using VVS Web. You'll learn how to create nodes for mathematical operations and connect them to build a functional calculator.

## Table of Contents

1. [Introduction](#introduction)
2. [Setting Up the Project](#setting-up-the-project)
3. [Creating Input Nodes](#creating-input-nodes)
4. [Adding Operation Nodes](#adding-operation-nodes)
5. [Implementing User Choice](#implementing-user-choice)
6. [Adding the Output](#adding-the-output)
7. [Executing the Program](#executing-the-program)
8. [Improving the Calculator](#improving-the-calculator)
9. [Next Steps](#next-steps)

## Introduction

In this tutorial, we'll build a simple calculator that can perform basic arithmetic operations (addition, subtraction, multiplication, and division) on two numbers. The program will:

1. Ask the user for two numbers
2. Ask the user which operation to perform
3. Perform the selected operation
4. Display the result

This project will help you understand how to use conditional logic and mathematical operations in VVS Web.

## Setting Up the Project

Let's start by creating a new project:

1. Press `Ctrl+N` to create a new project (or click "New Project" in the menu)
2. When prompted, name your project "SimpleCalculator"

## Creating Input Nodes

First, we need to get two numbers from the user:

1. From the Node Library, find the "Input/Output" category
2. Drag two "Input" nodes onto the canvas
3. Select the first Input node and set its properties:
   - Set "Prompt" to "Enter the first number: "
   - Set "Variable Name" to "num1"
   - Set "Output Type" to "Number"
4. Select the second Input node and set its properties:
   - Set "Prompt" to "Enter the second number: "
   - Set "Variable Name" to "num2"
   - Set "Output Type" to "Number"

Next, let's create an input for selecting the operation:

1. Drag another "Input" node onto the canvas
2. Set its properties:
   - Set "Prompt" to "Enter operation (+, -, *, /): "
   - Set "Variable Name" to "operation"
   - Set "Output Type" to "String"

Your canvas should now have three input nodes.

## Adding Operation Nodes

Now, let's add nodes for each arithmetic operation:

1. From the "Math" category, drag the following nodes onto the canvas:
   - "Add" node
   - "Subtract" node
   - "Multiply" node
   - "Divide" node

2. Connect the outputs of your input nodes to the operation nodes:
   - Connect "num1" output to the first input of each operation node
   - Connect "num2" output to the second input of each operation node

Your canvas should now look something like this:

![Calculator Operations](../../images/calculator_operations.png)

## Implementing User Choice

Next, we need to implement the logic to choose which operation to perform based on the user's input:

1. From the "Control Flow" category, drag an "If" node onto the canvas
2. From the "Logic" category, drag an "Equal" node onto the canvas
3. Connect the "operation" output to the first input of the "Equal" node
4. From the "String" category, drag a "Create String" node
5. Set its value to "+"
6. Connect its output to the second input of the "Equal" node
7. Connect the "Equal" node output to the "Condition" input of the "If" node
8. Connect the "Add" node's output to the "True" input of the "If" node

Let's repeat this process for the other operations:

1. For subtraction:
   - Add another "If" node
   - Add another "Equal" node
   - Create a string node with value "-"
   - Connect the "operation" output to the first input of this "Equal" node
   - Connect the string node to the second input of this "Equal" node
   - Connect this "Equal" node to the condition of the second "If" node
   - Connect the "Subtract" node's output to the "True" input
   - Connect the first "If" node's "False" output to the second "If" node's input

2. Repeat for multiplication and division with "*" and "/"

## Adding the Output

Finally, let's add a node to display the result:

1. From the "Input/Output" category, drag a "Print" node onto the canvas
2. Connect the output of the last "If" node to the input of the "Print" node
3. From the "String" category, drag a "Create String" node
4. Set its value to "Result: "
5. From the "String" category, drag a "Concatenate" node
6. Connect the "Create String" node to the first input of the "Concatenate" node
7. Connect the last "If" node's output to the second input of the "Concatenate" node
8. Connect the "Concatenate" node's output to the "Print" node

Your complete calculator should look something like this:

![Complete Calculator](../../images/complete_calculator.png)

## Executing the Program

Let's test our calculator:

1. Click the "Run" button or press F5
2. Enter the first number when prompted (e.g., 10)
3. Enter the second number when prompted (e.g., 5)
4. Enter the operation you want to perform (e.g., "+")
5. The program will display the result (e.g., "Result: 15")

## Improving the Calculator

Here are some ways you can improve the calculator:

1. Add error handling for division by zero
2. Add support for more operations (e.g., power, modulo)
3. Improve the input validation for the operation choice
4. Add the ability to perform multiple calculations without restarting

## Next Steps

Congratulations! You've created a simple calculator using VVS Web. You've learned how to:

- Create input nodes to get user input
- Use mathematical operation nodes
- Implement conditional logic to choose between different operations
- Display the result to the user

In the next tutorial, [Working with Strings](./STRING_OPERATIONS.md), you'll learn how to work with text data in your visual programs.

## Related Documents

- [First Steps with VVS Web](./FIRST_STEPS.md)
- [Working with Strings](./STRING_OPERATIONS.md)
- [Control Flow](../intermediate/CONTROL_FLOW.md) 