import { ProjectTemplate } from './types';

export const VANILLA_TEMPLATE: ProjectTemplate = {
    id: 'vanilla',
    name: 'HTML/CSS/JS',
    description: 'Basic HTML, CSS, and JavaScript starter',
    icon: '🌐',
    files: [
        {
            name: 'index.html',
            language: 'html',
            content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>My Project</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <div class="container">
    <h1>Welcome to ProjectCraft Build! 🚀</h1>
    <p>Start coding and see your changes live!</p>
    <button id="btn">Click Me</button>
    <div id="output"></div>
  </div>
  <script src="script.js"></script>
</body>
</html>`
        },
        {
            name: 'styles.css',
            language: 'css',
            content: `* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.container {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  padding: 3rem;
  text-align: center;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

h1 {
  font-size: 2.5rem;
  margin-bottom: 1rem;
  animation: fadeIn 0.8s ease-in;
}

p {
  font-size: 1.2rem;
  margin-bottom: 2rem;
  opacity: 0.9;
}

button {
  background: white;
  color: #667eea;
  border: none;
  padding: 1rem 2rem;
  font-size: 1.1rem;
  font-weight: 600;
  border-radius: 50px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
}

button:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
}

button:active {
  transform: translateY(0);
}

#output {
  margin-top: 2rem;
  font-size: 1.5rem;
  font-weight: 600;
  min-height: 2rem;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}`
        },
        {
            name: 'script.js',
            language: 'javascript',
            content: `// Your JavaScript code here
const btn = document.getElementById('btn');
const output = document.getElementById('output');

let clickCount = 0;

btn.addEventListener('click', () => {
  clickCount++;
  output.textContent = \`Button clicked \${clickCount} time\${clickCount !== 1 ? 's' : ''}! 🎉\`;
  console.log('Button clicked:', clickCount);
});

console.log('App initialized successfully! ✅');`
        }
    ]
};

export const REACT_TEMPLATE: ProjectTemplate = {
    id: 'react',
    name: 'React',
    description: 'React component with JSX',
    icon: '⚛️',
    files: [
        {
            name: 'index.html',
            language: 'html',
            content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>React App</title>
</head>
<body>
  <div id="root"></div>
</body>
</html>`
        },
        {
            name: 'App.jsx',
            language: 'jsx',
            content: `import React, { useState } from 'react';
import './styles.css';

function App() {
  const [count, setCount] = useState(0);
  const [todos, setTodos] = useState([]);
  const [input, setInput] = useState('');

  const addTodo = () => {
    if (input.trim()) {
      setTodos([...todos, { id: Date.now(), text: input, done: false }]);
      setInput('');
    }
  };

  const toggleTodo = (id) => {
    setTodos(todos.map(todo => 
      todo.id === id ? { ...todo, done: !todo.done } : todo
    ));
  };

  const deleteTodo = (id) => {
    setTodos(todos.filter(todo => todo.id !== id));
  };

  return (
    <div className="app">
      <header className="header">
        <h1>⚛️ React Todo App</h1>
        <p>Built with React Hooks</p>
      </header>

      <div className="counter">
        <h2>Counter: {count}</h2>
        <div className="counter-buttons">
          <button onClick={() => setCount(count - 1)}>−</button>
          <button onClick={() => setCount(0)}>Reset</button>
          <button onClick={() => setCount(count + 1)}>+</button>
        </div>
      </div>

      <div className="todo-section">
        <h2>📝 Todo List</h2>
        <div className="todo-input">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addTodo()}
            placeholder="Add a new task..."
          />
          <button onClick={addTodo}>Add</button>
        </div>
        <ul className="todo-list">
          {todos.map(todo => (
            <li key={todo.id} className={todo.done ? 'done' : ''}>
              <input
                type="checkbox"
                checked={todo.done}
                onChange={() => toggleTodo(todo.id)}
              />
              <span onClick={() => toggleTodo(todo.id)}>{todo.text}</span>
              <button onClick={() => deleteTodo(todo.id)}>✕</button>
            </li>
          ))}
        </ul>
        {todos.length > 0 && (
          <p className="todo-stats">
            {todos.filter(t => !t.done).length} of {todos.length} tasks remaining
          </p>
        )}
      </div>
    </div>
  );
}

export default App;`
        },
        {
            name: 'styles.css',
            language: 'css',
            content: `* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  min-height: 100vh;
  padding: 2rem;
}

.app {
  max-width: 600px;
  margin: 0 auto;
  background: white;
  border-radius: 20px;
  padding: 2rem;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.header {
  text-align: center;
  margin-bottom: 2rem;
  padding-bottom: 1.5rem;
  border-bottom: 2px solid #f0f0f0;
}

.header h1 {
  color: #333;
  margin-bottom: 0.5rem;
}

.header p {
  color: #666;
  font-size: 0.9rem;
}

.counter {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 1.5rem;
  border-radius: 15px;
  text-align: center;
  margin-bottom: 2rem;
}

.counter h2 {
  font-size: 2rem;
  margin-bottom: 1rem;
}

.counter-buttons {
  display: flex;
  gap: 1rem;
  justify-content: center;
}

.counter-buttons button {
  background: white;
  color: #667eea;
  border: none;
  padding: 0.75rem 1.5rem;
  font-size: 1.2rem;
  font-weight: 600;
  border-radius: 50px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.counter-buttons button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.todo-section h2 {
  color: #333;
  margin-bottom: 1rem;
}

.todo-input {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
}

.todo-input input {
  flex: 1;
  padding: 0.75rem 1rem;
  border: 2px solid #e0e0e0;
  border-radius: 10px;
  font-size: 1rem;
  transition: border-color 0.3s ease;
}

.todo-input input:focus {
  outline: none;
  border-color: #667eea;
}

.todo-input button {
  background: #667eea;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 10px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.todo-input button:hover {
  background: #5568d3;
  transform: translateY(-2px);
}

.todo-list {
  list-style: none;
}

.todo-list li {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 10px;
  margin-bottom: 0.5rem;
  transition: all 0.3s ease;
}

.todo-list li:hover {
  background: #e9ecef;
}

.todo-list li.done span {
  text-decoration: line-through;
  opacity: 0.5;
}

.todo-list input[type="checkbox"] {
  width: 1.25rem;
  height: 1.25rem;
  cursor: pointer;
}

.todo-list span {
  flex: 1;
  cursor: pointer;
}

.todo-list button {
  background: #dc3545;
  color: white;
  border: none;
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.3s ease;
}

.todo-list button:hover {
  background: #c82333;
  transform: scale(1.1);
}

.todo-stats {
  text-align: center;
  margin-top: 1rem;
  color: #666;
  font-size: 0.9rem;
}`
        }
    ]
};

export const NEXTJS_TEMPLATE: ProjectTemplate = {
    id: 'nextjs',
    name: 'Next.js',
    description: 'Next.js page component',
    icon: '▲',
    files: [
        {
            name: 'page.tsx',
            language: 'tsx',
            content: `'use client';

import React, { useState, useEffect } from 'react';
import './styles.css';

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    setMounted(true);
    // Simulate API fetch
    setTimeout(() => {
      setData({
        title: 'Next.js 14',
        features: ['React Server Components', 'App Router', 'Turbopack', 'Server Actions']
      });
    }, 1000);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <main className="main">
      <div className="hero">
        <h1>▲ Next.js</h1>
        <p className="subtitle">The React Framework for Production</p>
      </div>

      {data ? (
        <div className="content">
          <h2>{data.title} Features</h2>
          <div className="features">
            {data.features.map((feature: string, index: number) => (
              <div key={index} className="feature-card">
                <span className="icon">✨</span>
                <h3>{feature}</h3>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="loading">Loading...</div>
      )}

      <footer className="footer">
        <p>Built with ProjectCraft Build</p>
      </footer>
    </main>
  );
}`
        },
        {
            name: 'styles.css',
            language: 'css',
            content: `* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
  background: #000;
  color: white;
  min-height: 100vh;
}

.main {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.hero {
  text-align: center;
  padding: 4rem 0;
  background: linear-gradient(to right, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05));
  border-radius: 20px;
  margin-bottom: 3rem;
}

.hero h1 {
  font-size: 4rem;
  margin-bottom: 1rem;
  background: linear-gradient(to right, #fff, #888);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.subtitle {
  font-size: 1.5rem;
  color: #888;
}

.content {
  padding: 2rem 0;
}

.content h2 {
  font-size: 2rem;
  margin-bottom: 2rem;
  text-align: center;
}

.features {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
}

.feature-card {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 15px;
  padding: 2rem;
  text-align: center;
  transition: all 0.3s ease;
}

.feature-card:hover {
  background: rgba(255, 255, 255, 0.1);
  transform: translateY(-5px);
  border-color: rgba(255, 255, 255, 0.2);
}

.feature-card .icon {
  font-size: 2.5rem;
  display: block;
  margin-bottom: 1rem;
}

.feature-card h3 {
  font-size: 1.2rem;
  color: #fff;
}

.loading {
  text-align: center;
  padding: 3rem;
  font-size: 1.5rem;
  color: #888;
}

.footer {
  text-align: center;
  padding: 3rem 0;
  margin-top: 4rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  color: #666;
}`
        }
    ]
};

export const ALL_TEMPLATES: ProjectTemplate[] = [
    VANILLA_TEMPLATE,
    REACT_TEMPLATE,
    NEXTJS_TEMPLATE
];

export const getTemplateById = (id: string): ProjectTemplate | undefined => {
    return ALL_TEMPLATES.find(t => t.id === id);
};
