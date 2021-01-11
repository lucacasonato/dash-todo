import { query } from "./fauna.ts";

export interface User {
  _id: string;
  name: string;
  todos: Todo[];
}

export interface Todo {
  _id: string;
  title: string;
  completed: boolean;
}

function gql(str: TemplateStringsArray): string {
  return str.join("");
}

const getUserQuery = gql`
  query($id: ID!) {
    findUserByID(id: $id) {
      _id
      name
      todos {
        data {
          _id
          title
          completed
        }
      }
    }
  }
`;
export async function getUser(id: string): Promise<User | null> {
  const res = await query<{
    findUserByID: { _id: string; name: string; todos: { data: Todo[] } } | null;
  }>(getUserQuery, { id });
  const user = res.findUserByID;
  if (!user) return null;
  return { _id: user._id, name: user.name, todos: user.todos.data };
}

const createUserQuery = gql`
  mutation($name: String!) {
    createUser(data: { name: $name }) {
      _id
      name
    }
  }
`;
export async function createUser(name: string): Promise<User> {
  const res = await query<{ createUser: User }>(createUserQuery, { name });
  return res.createUser;
}

const createTodoQuery = gql`
  mutation($title: String!, $owner: ID!) {
    createTodo(
      data: { title: $title, completed: false, owner: { connect: $owner } }
    ) {
      _id
      title
      completed
    }
  }
`;
export async function createTodo(title: string, owner: string): Promise<Todo> {
  const res = await query<{ createTodo: Todo }>(createTodoQuery, {
    title,
    owner,
  });
  return res.createTodo;
}

const getTodoOwnerQuery = gql`
  query($id: ID!) {
    findTodoByID(id: $id) {
      owner {
        _id
        name
      }
    }
  }
`;
export async function getTodoOwner(id: string): Promise<User | null> {
  const res = await query<{ findTodoByID: { owner: User } | null }>(
    getTodoOwnerQuery,
    { id }
  );
  if (!res.findTodoByID) return null;
  return res.findTodoByID.owner;
}

const updateTodoQuery = gql`
  mutation($id: ID!, $completed: Boolean!) {
    partialUpdateTodo(id: $id, data: { completed: $completed }) {
      _id
      title
      completed
    }
  }
`;
export async function updateTodo(
  id: string,
  completed: boolean
): Promise<Todo> {
  const res = await query<{ partialUpdateTodo: Todo }>(updateTodoQuery, {
    id,
    completed,
  });
  return res.partialUpdateTodo;
}
