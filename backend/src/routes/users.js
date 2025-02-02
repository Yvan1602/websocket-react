import {
  getUserById,
  getUsers,
  loginUser,
  registerUser,
} from "../controllers/users.js";

export function usersRoutes(app, blacklistedTokens) {
  app.post("/login", async (request, reply) => {
    reply.send(await loginUser(request.body, app));
  });

  app.post(
    "/logout",
    { preHandler: [app.authenticate] },
    async (request, reply) => {
      const token = request.headers["authorization"].split(" ")[1]; // Récupérer le token depuis l'en-tête Authorization

      // Ajouter le token à la liste noire
      blacklistedTokens.push(token);

      reply.send({ logout: true });
    }
  );

  // Inscription
  app.post("/register", async (request, reply) => {
    reply.send(await registerUser(request.body, app.bcrypt));
  });

  // Récupération de la liste des utilisateurs
  app.get("/users", async (request, reply) => {
    reply.send(await getUsers());
  });

  // Récupération d'un utilisateur par son id
  app.get("/users/:id", async (request, reply) => {
    reply.send(await getUserById(request.params.id));
  });

  // Récupération de l'utilisateur courant
  app.get(
    "/api/users/me",
    { preHandler: [app.authenticate] },
    async (request, reply) => {
      const user = await getUserById(request.user.id);
      reply.send(user);
    }
  );
}
