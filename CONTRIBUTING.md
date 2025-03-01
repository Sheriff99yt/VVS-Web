# Contributing to VVS Web

First off, thank you for considering contributing to VVS Web! It's people like you that make VVS Web such a great tool.

## Code of Conduct

By participating in this project, you are expected to uphold our Code of Conduct:

- Use welcoming and inclusive language
- Be respectful of different viewpoints and experiences
- Gracefully accept constructive criticism
- Focus on what is best for the community
- Show empathy towards other community members

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check the issue list as you might find out that you don't need to create one. When you are creating a bug report, please include as many details as possible:

* **Use a clear and descriptive title**
* **Describe the exact steps to reproduce the problem**
* **Provide specific examples to demonstrate the steps**
* **Describe the behavior you observed after following the steps**
* **Explain which behavior you expected to see instead and why**
* **Include screenshots and animated GIFs if possible**

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion, please include:

* **Use a clear and descriptive title**
* **Provide a step-by-step description of the suggested enhancement**
* **Provide specific examples to demonstrate the steps**
* **Describe the current behavior and explain the behavior you expected to see instead**
* **Explain why this enhancement would be useful**

### Pull Requests

1. **Fork the Repository**
   ```bash
   git clone https://github.com/Sheriff99yt/VVS-Web.git
   cd vvs-web
   ```

2. **Create a Branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Make Your Changes**
   - Follow the [coding standards](#coding-standards)
   - Add or update tests as needed
   - Update documentation as needed

4. **Test Your Changes**
   ```bash
   npm install
   npm test
   npm run lint
   ```

5. **Commit Your Changes**
   ```bash
   git add .
   git commit -m "feat: add some feature"
   ```
   Follow [Conventional Commits](https://www.conventionalcommits.org/) specification

6. **Push to Your Fork**
   ```bash
   git push origin feature/your-feature-name
   ```

7. **Submit a Pull Request**
   - Fill in the required template
   - Link any relevant issues
   - Include screenshots and animated GIFs if relevant

## Development Setup

1. **Prerequisites**
   - Node.js 18+
   - npm 9+ or yarn 1.22+
   - Git

2. **Installation**
   ```bash
   npm install
   ```

3. **Development Server**
   ```bash
   npm run dev
   ```

4. **Testing**
   ```bash
   npm test
   ```

## Coding Standards

### TypeScript

- Use TypeScript strict mode
- Avoid `any` type
- Document complex types
- Use meaningful variable names

```typescript
// Good
interface UserData {
  id: string;
  name: string;
  email: string;
}

// Bad
interface Data {
  a: any;
  b: any;
  c: any;
}
```

### React

- Use functional components
- Use hooks appropriately
- Implement proper prop types
- Keep components focused

```typescript
// Good
const UserProfile: React.FC<UserProfileProps> = ({ user }) => {
  return (
    <div>
      <h2>{user.name}</h2>
      <p>{user.email}</p>
    </div>
  );
};

// Bad
const Component = (props) => {
  // No type checking
  return <div>{props.data}</div>;
};
```

### CSS

- Use CSS modules
- Follow BEM naming convention
- Keep selectors specific
- Maintain theme consistency

```css
/* Good */
.user-profile {
  padding: var(--spacing-medium);
}

.user-profile__name {
  color: var(--text-primary);
}

/* Bad */
.profile {
  padding: 20px;
  color: blue;
}
```

### Testing

- Write meaningful tests
- Test edge cases
- Use meaningful assertions
- Keep tests focused

```typescript
// Good
describe('UserProfile', () => {
  it('should display user name', () => {
    const user = { name: 'John', email: 'john@example.com' };
    const { getByText } = render(<UserProfile user={user} />);
    expect(getByText('John')).toBeInTheDocument();
  });
});

// Bad
describe('Component', () => {
  it('works', () => {
    expect(true).toBe(true);
  });
});
```

## File Organization

```
src/
├── components/          # React components
│   ├── layout/         # Layout components
│   ├── canvas/         # Graph canvas components
│   └── code/          # Code preview components
│
├── styles/             # Global styles
│   ├── theme/         # Theme definitions
│   └── components/    # Component styles
│
└── types/             # TypeScript definitions
    ├── nodes.ts      # Node type definitions
    └── ui.ts         # UI type definitions
```

## Documentation

- Update documentation for new features
- Include JSDoc comments for functions
- Add examples where helpful
- Keep README.md updated

```typescript
/**
 * Creates a new node in the graph
 * @param {NodeConfig} config - The node configuration
 * @returns {Node} The created node
 * @throws {ValidationError} If the config is invalid
 */
function createNode(config: NodeConfig): Node {
  // Implementation
}
```

## Review Process

1. **Initial Review**
   - Code style and standards
   - Documentation completeness
   - Test coverage
   - Performance considerations

2. **Technical Review**
   - Architecture alignment
   - Security implications
   - Edge case handling
   - Error handling

3. **Final Review**
   - Documentation accuracy
   - Test reliability
   - Code cleanliness
   - Performance impact

## Getting Help

- Check the [documentation](docs/)
- Join our [Discord community](https://discord.gg/vvsweb)
- Ask in GitHub discussions
- Review existing issues

## Recognition

Contributors are recognized in:
- Release notes
- Contributors list
- Documentation credits

Thank you for contributing to VVS Web! 