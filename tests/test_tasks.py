import pytest
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'app'))

from app import app

@pytest.fixture
def client():
    app.config["TESTING"] = True
    with app.test_client() as client:
        yield client

# GET /tasks
def test_get_tasks_returns_list(client):
    response = client.get("/tasks")
    assert response.status_code == 200
    assert isinstance(response.get_json(), list)

# POST /tasks
def test_create_task(client):
    response = client.post("/tasks", json={
        "title": "Test Task",
        "description": "A test task",
        "priority": "high"
    })
    assert response.status_code == 201
    data = response.get_json()
    assert data["title"] == "Test Task"
    assert data["description"] == "A test task"
    assert data["priority"] == "high"

def test_create_task_missing_title(client):
    response = client.post("/tasks", json={
        "description": "No title here"
    })
    assert response.status_code == 400
    assert "error" in response.get_json()

# GET /tasks/<id>
def test_get_single_task(client):
    # Make a task first
    create = client.post("/tasks", json={"title": "Single Task"})
    task_id = create.get_json()["id"]
    response = client.get(f"/tasks/{task_id}")
    assert response.status_code == 200
    assert response.get_json()["id"] == task_id

def test_get_nonexistent_task(client):
    response = client.get("/tasks/999999")
    assert response.status_code == 404

# PATCH /tasks/<id>
def test_update_task(client):
    create = client.post("/tasks", json={"title": "Original Title"})
    task_id = create.get_json()["id"]
    response = client.patch(f"/tasks/{task_id}", json={
        "title": "Updated Title"
    })
    assert response.status_code == 200
    assert response.get_json()["title"] == "Updated Title"

def test_update_task_priority(client):
    create = client.post("/tasks", json={"title": "Priority Task"})
    task_id = create.get_json()["id"]
    response = client.patch(f"/tasks/{task_id}", json={"priority": "high"})
    assert response.status_code == 200
    assert response.get_json()["priority"] == "high"

# DELETE /tasks/<id>
def test_delete_task(client):
    create = client.post("/tasks", json={"title": "To Be Deleted"})
    task_id = create.get_json()["id"]
    response = client.delete(f"/tasks/{task_id}")
    assert response.status_code == 200

    get = client.get(f"/tasks/{task_id}")
    assert get.status_code == 404

def test_delete_nonexistent_task(client):
    response = client.delete("/tasks/999999")
    assert response.status_code == 404

    