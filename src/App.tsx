import { useEffect, useState } from "react";
import { useAuthenticator } from '@aws-amplify/ui-react';
import type { Schema } from "../amplify/data/resource";
import { generateClient } from "aws-amplify/data";

const client = generateClient<Schema>();

function App() {
  const { user, signOut } = useAuthenticator();
  const [todos, setTodos] = useState<Array<Schema["Todo"]["type"]>>([]);

  useEffect(() => {
    client.models.Todo.observeQuery().subscribe({
      next: (data) => setTodos([...data.items]),
    });
  }, []);

  function createTodo() {
    client.models.Todo.create({ content: window.prompt("Todo content") });
  }

  function deleteTodo(id: string) {
    client.models.Todo.delete({ id });
  }

  return (
    <main>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1>{user?.signInDetails?.loginId}'s todos</h1>
        <button onClick={signOut} style={{ padding: '8px 16px', backgroundColor: '#ff4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
          Sign out
        </button>
      </div>
      
      <button onClick={createTodo}>+ new</button>
      
      <ul>
        {todos.map((todo) => (
          <li key={todo.id} onClick={() => deleteTodo(todo.id)} style={{ cursor: 'pointer', padding: '8px', margin: '4px 0', backgroundColor: '#f0f0f0', borderRadius: '4px' }}>
            {todo.content} <span style={{ color: '#666', fontSize: '12px' }}>(click to delete)</span>
          </li>
        ))}
      </ul>
      
      <div style={{ marginTop: '40px', padding: '20px', backgroundColor: '#e8f5e8', borderRadius: '8px' }}>
        🥳 App successfully hosted with authentication!
        <br />
        <strong>Features added:</strong> User login, personalized todos, sign out functionality
      </div>
    </main>
  );
}

export default App;
