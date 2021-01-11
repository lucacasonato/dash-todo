import { serve } from "https://deno.land/x/sift@0.1.1/mod.js";
import {
  deleteCookie,
  getCookies,
  setCookie,
} from "https://deno.land/std@0.83.0/http/cookie.ts";
import {
  createTodo,
  createUser,
  getTodoOwner,
  getUser,
  updateTodo,
} from "./data.ts";
import { h } from "https://x.lcas.dev/preact@10.5.7/mod.js";

serve({
  "/": Home,
  "/createuser": CreateUser,
  "/signin": Signin,
  "/add": AddTodo,
  "/update": UpdateTodo,
  "/signout": Signout,
});

async function Home(req: Request) {
  const cookies = getCookies(req);
  const userId: string | undefined = cookies["user"];
  console.log(`headers: ${JSON.stringify(req.headers)}`);
  console.log(`cookies: ${JSON.stringify(cookies)}`);
  console.log(`userId: ${userId}`);

  if (userId) {
    const user = await getUser(userId);
    if (!user) {
      const response = Response.redirect("/", 303);
      deleteCookie(response, "user");
      return response;
    }
    return (
      <div>
        <h1>Welcome {user.name}</h1>
        <p>View your todos below:</p>
        {user.todos.length == 0 ? (
          <p>
            <i>You have no todos yet.</i>
          </p>
        ) : (
          <ul>
            {user.todos.map((todo) => (
              <li>
                <form action="/update" method="POST">
                  <input name="id" value={todo._id} hidden />
                  <input
                    type="checkbox"
                    name="completed"
                    checked={todo.completed}
                    onChange="this.form.submit()"
                  />
                  {todo.title}
                </form>
              </li>
            ))}
          </ul>
        )}

        {/* <ul>
            
          </ul> */}
        <form action="/add" method="POST">
          <input name="title" type="text" />
          <button type="submit">Add Todo</button>
        </form>

        <form action="/signout" method="POST">
          <button type="submit">Signout</button>
        </form>
      </div>
    );
  } else {
    return (
      <div>
        <h1>Welcome to Dash Todo</h1>
        <p>
          This is the _ultimate_ todo application, for all of your todo
          application needs!
        </p>
        <form action="/createuser" method="POST">
          <label htmlFor="name">Name</label>
          <input name="name" id="name" type="text" />
          <button type="submit">Create Account</button>
        </form>

        <form action="/signin" method="POST">
          <label htmlFor="token">Token</label>
          <input name="token" id="token" type="password" />
          <button type="submit">Signin</button>
        </form>
      </div>
    );
  }
}

export async function CreateUser(req: Request) {
  if (req.method == "POST") {
    const data = await req.formData();
    const name = data.get("name");
    if (typeof name !== "string") {
      return <div>Name must be a string.</div>;
    }
    if (name.length >= 64) {
      return <div>Name must be less or equal to 64 chars.</div>;
    }
    const user = await createUser(name);
    const response = new Response(
      `<div>User account created. Your signin token is ${user._id}. Save this token, you will _not be able to sign in otherwise_. The token will NOT be shown later, and can not be recovered.</div><a href="/">Go home</a>`
    );
    setCookie(response, {
      name: "user",
      value: user._id,
      sameSite: "Lax",
    });
    return response;
  }
}

export async function Signin(req: Request) {
  if (req.method == "POST") {
    const data = await req.formData();
    const token = data.get("token");
    if (typeof token !== "string") {
      return <div>Signin token must be a string.</div>;
    }
    if (token.length >= 64) {
      return <div>Signin token must be less or equal to 64 chars.</div>;
    }
    const user = await getUser(token);
    if (!user) {
      return <div>Signin token not valid.</div>;
    }
    const response = Response.redirect("/", 303);
    setCookie(response, {
      name: "user",
      value: user._id,
      sameSite: "Strict",
    });
    return response;
  }
}

export async function AddTodo(req: Request) {
  if (req.method == "POST") {
    const cookies = getCookies(req);
    const userId: string | undefined = cookies["user"];
    if (!userId) {
      return <div>Not signed in!</div>;
    }
    const data = await req.formData();
    const title = data.get("title");
    if (typeof title !== "string") {
      return <div>Todo title must be a string.</div>;
    }
    if (title.length >= 256) {
      return <div>Todo title must be less or equal to 256 chars.</div>;
    }
    await createTodo(title, userId);
    return Response.redirect("/", 303);
  }
}

export async function UpdateTodo(req: Request) {
  if (req.method == "POST") {
    const cookies = getCookies(req);
    const userId: string | undefined = cookies["user"];
    if (!userId) {
      return <div>Not signed in!</div>;
    }

    const data = await req.formData();
    const id = data.get("id");
    const completed = data.get("completed");
    if (typeof id !== "string") {
      return <div>Todo id must be a string.</div>;
    }
    if (id.length >= 64) {
      return <div>Todo id must be less or equal to 64 chars.</div>;
    }
    if (completed !== "on" && completed !== null) {
      return <div>Todo completed must be on or null.</div>;
    }

    const user = await getTodoOwner(id);
    if (user?._id !== userId) {
      return <div>Not authorized.</div>;
    }

    await updateTodo(id, completed === "on");
    return Response.redirect("/", 303);
  }
}

export async function Signout(req: Request) {
  const response = Response.redirect("/", 303);
  deleteCookie(response, "user");
  return response;
}
