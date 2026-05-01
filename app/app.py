from flask import Flask, jsonify, request
import psycopg2
import psycopg2.extras
import os

app = Flask(__name__)

def get_db():
	return psycopg2.connect(os.environ["DATABASE_URL"])

def init_db():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS tasks (
            id SERIAL PRIMARY KEY,
            title VARCHAR(255) NOT NULL,
            description TEXT,
            priority VARCHAR(10) DEFAULT 'medium',
            done BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    """)
    conn.commit()
    conn.close()

# Call it when the app starts
init_db()

# GET all tasks
@app.route("/tasks", methods=["GET"])
def get_tasks():
	conn = get_db()
	cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
	cursor.execute("SELECT * FROM tasks ORDER BY created_at DESC;")
	tasks = cursor.fetchall()
	conn.close()
	return jsonify(list(tasks))

# GET a single task
@app.route("/tasks/<int:task_id>", methods=["GET"])
def get_task(task_id):
	conn = get_db()
	cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
	cursor.execute("SELECT * FROM tasks WHERE id = %s;", (task_id,))
	task = cursor.fetchone()
	if task is None:
		return jsonify({"error": "Task not found!"}), 404
	return jsonify(task)

# POST a new task
@app.route("/tasks", methods=["POST"])
def create_task():
	data = request.get_json()
	if not data or "title" not in data:
		return jsonify({"error": "Title is required"}), 400
	conn = get_db()
	cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
	cursor.execute(
		"INSERT INTO tasks (title, description, priority) VALUES (%s, %s, %s) RETURNING *;",
		(data["title"], data.get("description", ""), data.get("priority", "medium"))
	)
	task = cursor.fetchone()
	conn.commit()
	conn.close()
	return jsonify(task), 201

# UPDATE a task
@app.route("/tasks/<int:task_id>", methods=["PATCH"])
def update_task(task_id):
    data = request.get_json()
    conn = get_db()
    cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    cursor.execute(
        """UPDATE tasks 
           SET done = COALESCE(%s::boolean, done),
               title = COALESCE(%s, title),
               description = COALESCE(%s, description),
			   priority = COALESCE(%s, priority)
           WHERE id = %s RETURNING *;""",
        (data.get("done"), data.get("title"), data.get("description"), data.get("priority"), task_id)
    )
    task = cursor.fetchone()
    conn.commit()
    conn.close()
    if task is None:
        return jsonify({"error": "Task not found"}), 404
    return jsonify(task)

# DELETE a task
@app.route("/tasks/<int:task_id>", methods=["DELETE"])
def delete_task(task_id):
	conn = get_db()
	cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
	cursor.execute("DELETE FROM tasks WHERE id = %s RETURNING id;", (task_id,))
	deleted = cursor.fetchone()
	if deleted is None:
		return jsonify({"error": "Task not found"}), 404
	return jsonify({"message": f"Task {deleted['id']} deleted"}), 200


@app.route("/")
def hello():
	return jsonify({"message": "Hello from Flask!"})

@app.route("/health")
def health():
	try:
		conn = get_db()
		conn.close()
		return jsonify({"status": "healthy", "database": "connected"})
	except Exception as e:
		return jsonify({"status": "unhealthy", "error": str(e)}), 500

if __name__ == "__main__":
	port = int(os.environ.get("PORT", 5000))
	app.run(host="0.0.0.0", port=port, debug=True)
