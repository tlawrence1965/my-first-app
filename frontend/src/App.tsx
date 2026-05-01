import { useState, useEffect } from "react";

interface Task {
  id: number;
  title: string;
  description: string;
  priority: string;
}

const priorityColors: Record<string, string> = {
  low: "#4caf50",
  medium: "#f0a500",
  high: "#ff4444"
}

function App() {
  const [priority, setPriority] = useState("medium");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editPriority, setEditPriority] = useState("medium");

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    const res = await fetch("/tasks");
    const data = await res.json();
    setTasks(data);
  };

  const createTask = async () => {
    if (!title.trim()) {
      setError("Title is required");
      return;
    }
    await fetch("/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, description, priority }),
    });
    setTitle("");
    setDescription("");
    setError(null);
    setPriority("medium");
    fetchTasks();
  };

  const deleteTask = async (id: number) => {
    const res = await fetch(`/tasks/${id}`, { method: "DELETE" });
    if (res.ok) {
      setTasks((prev) => prev.filter((task) => task.id !== id));
    }
  };

  const startEditing = (task: Task) => {
    setEditingId(task.id);
    setEditTitle(task.title);
    setEditDescription(task.description);
    setEditPriority(task.priority);
  };

  const saveEdit = async (id: number) => {
    if (!editTitle.trim()) return;
    const res = await fetch(`/tasks/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: editTitle, description: editDescription, priority: editPriority }),
    });
    if (res.ok) {
      setTasks((prev) =>
        prev.map((t) =>
          t.id === id ? { ...t, title: editTitle, description: editDescription, priority: editPriority } : t
        )
      );
      setEditingId(null);
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  return (
    <div style={{ maxWidth: "600px", margin: "40px auto", fontFamily: "sans-serif", padding: "0 20px" }}>
      <h1>Task Manager</h1>

      {/* Create Task Form */}
      <div style={{ marginBottom: "30px", padding: "20px", background: "#f5f5f5", borderRadius: "8px" }}>
        <h2 style={{ marginTop: 0 }}>New Task</h2>
        {error && <p style={{ color: "red" }}>{error}</p>}
        <input
          type="text"
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          style={{ display: "block", width: "100%", marginBottom: "10px", padding: "8px", boxSizing: "border-box" }}
        />
        <input
          type="text"
          placeholder="Description (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          style={{ display: "block", width: "100%", marginBottom: "10px", padding: "8px", boxSizing: "border-box" }}
        />
        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
          style={{ display: "block", width: "100%", marginBottom: "10px", padding: "8px", boxSizing: "border-box" }}
        >
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
        <button
          onClick={createTask}
          style={{ padding: "8px 20px", background: "#0070f3", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}
        >
          Add Task
        </button>
      </div>

      {/* Task List */}
      {tasks.length === 0 && <p>No tasks yet. Add one above!</p>}
      {tasks.map((task) => (
        <div
          key={task.id}
          style={{
            padding: "12px 16px", marginBottom: "10px",
            background: "white",
            border: "1px solid #ddd", borderRadius: "8px"
          }}
        >
          {editingId === task.id ? (
            // Edit mode
            <div>
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                style={{ display: "block", width: "100%", marginBottom: "8px", padding: "8px", boxSizing: "border-box" }}
              />
              <input
                type="text"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                style={{ display: "block", width: "100%", marginBottom: "8px", padding: "8px", boxSizing: "border-box" }}
              />
              <select
                value={editPriority}
                onChange={(e) => setEditPriority(e.target.value)}
                style={{ display: "block", width: "100%", marginBottom: "8px", padding: "8px", boxSizing: "border-box" }}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  onClick={() => saveEdit(task.id)}
                  style={{ padding: "4px 12px", background: "#0070f3", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}
                >
                  Save
                </button>
                <button
                  onClick={cancelEdit}
                  style={{ padding: "4px 12px", background: "#888", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            // View mode
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontWeight: "bold" }}>
                  {task.title}
                </div>
                {task.description && <div style={{ fontSize: "0.85em", color: "#666" }}>{task.description}</div>}
              </div>
              <div style={{
                display: "inline-block",
                marginTop: "4px",
                padding: "2px 8px",
                borderRadius: "4px",
                fontSize: "0.75em",
                color: "white",
                background: priorityColors[task.priority] || "#888"
              }}>
                {task.priority}
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  onClick={() => startEditing(task)}
                  style={{ padding: "4px 10px", background: "#f0a500", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}
                >
                  Edit
                </button>
                <button
                  onClick={() => deleteTask(task.id)}
                  style={{ padding: "4px 10px", background: "#ff4444", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}
                >
                  Delete
                </button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default App;