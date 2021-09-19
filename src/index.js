const express = require("express");
const cors = require("cors");

const { v4: uuidv4 } = require("uuid");

const app = express();

app.use(cors());
app.use(express.json());

/*
{ 
	id: uuid
	name: string, 
	username: string, 
	todos: [
    { 
	    id: uuid,
	    title: string,
	    done: boolean, 
	    deadline: Date, 
	    created_at: Date
    }
  ]
} 
*/

const users = [];

function checksExistsUserAccount(request, response, next) {
  const { username } = request.headers;

  const foundUser = users.find((user) => user.username === username);

  if (!foundUser)
    return response.status(400).json({ error: "User does not exist" });

  request.user = foundUser;

  return next();
}

function findTodoById(user, todoId) {
  const foundTodo = user.todos.find((todo) => todo.id == todoId);

  return foundTodo;
}

app.post("/users", (request, response) => {
  const { name, username } = request.body;

  const userAlreadyExists = users.some((user) => user.username === username);

  if (userAlreadyExists) {
    return response.status(400).json({
      error: `username:${username} already belongs to another user`,
    });
  }

  const newUser = {
    id: uuidv4(),
    name,
    username,
    todos: [],
  };
  users.push(newUser);

  const createdUser = users.find((user) => user.id === newUser.id);

  if (!createdUser) {
    return response.status(400).json({ error: "Users was not created" });
  }

  return response.status(201).json(createdUser);
});

app.get("/todos", checksExistsUserAccount, (request, response) => {
  const { user } = request;

  return response.json(user.todos);
});

app.post("/todos", checksExistsUserAccount, (request, response) => {
  const { user } = request;
  const { title, deadline } = request.body;

  const newTodo = {
    id: uuidv4(),
    title,
    done: false,
    deadline: new Date(deadline),
    created_at: new Date(),
  };

  user.todos.push(newTodo);

  const createdTodo = findTodoById(user, newTodo.id);

  if (!createdTodo) {
    user.todos.pop();
    return response.status(400).json({ error: "Error creating new todo" });
  }

  return response.status(201).json(createdTodo);
});

app.put("/todos/:id", checksExistsUserAccount, (request, response) => {
  const { user } = request;
  const { id } = request.params;
  const { title, deadline } = request.body;

  const todo = findTodoById(user, id);

  if (!todo)
    return response.status(404).json({ error: `todo ${id} was not found` });

  todo.title = title;
  todo.deadline = new Date(deadline);

  return response.json(todo);
});

app.patch("/todos/:id/done", checksExistsUserAccount, (request, response) => {
  const { user } = request;
  const { id } = request.params;

  const todo = findTodoById(user, id);

  if (!todo)
    return response.status(404).json({ error: `todo ${id} was not found` });

  todo.done = true;

  return response.json(todo);
});

app.delete("/todos/:id", checksExistsUserAccount, (request, response) => {
  const { user } = request;
  const { id } = request.params;

  const todo = findTodoById(user, id);

  if (!todo)
    return response.status(404).json({ error: `todo ${id} was not found` });

  const deleteIndex = user.todos.indexOf(todo);

  user.todos.splice(deleteIndex, 1);

  return response.status(204).send();
});

module.exports = app;
