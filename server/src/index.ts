import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { z } from 'zod';

// Import schemas
import { 
  loginInputSchema, 
  searchCropsInputSchema,
  createCropInputSchema,
  updateCropInputSchema,
  updatePreferencesInputSchema,
  createSessionInputSchema,
  validateSessionInputSchema,
  cropCategoryEnum
} from './schema';

// Import handlers
import { loginUser } from './handlers/auth_login';
import { validateSession } from './handlers/auth_validate_session';
import { createSession } from './handlers/auth_create_session';
import { getCrops } from './handlers/get_crops';
import { searchCrops } from './handlers/search_crops';
import { getCropsByCategory } from './handlers/get_crops_by_category';
import { createCrop } from './handlers/create_crop';
import { updateCrop } from './handlers/update_crop';
import { getUserPreferences } from './handlers/get_user_preferences';
import { updateUserPreferences } from './handlers/update_user_preferences';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  // Health check
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // Authentication routes
  auth: router({
    login: publicProcedure
      .input(loginInputSchema)
      .mutation(({ input }) => loginUser(input)),
    
    validateSession: publicProcedure
      .input(validateSessionInputSchema)
      .query(({ input }) => validateSession(input)),
    
    createSession: publicProcedure
      .input(createSessionInputSchema)
      .mutation(({ input }) => createSession(input)),
  }),

  // Crop management routes
  crops: router({
    getAll: publicProcedure
      .query(() => getCrops()),
    
    search: publicProcedure
      .input(searchCropsInputSchema)
      .query(({ input }) => searchCrops(input)),
    
    getByCategory: publicProcedure
      .input(z.object({ category: cropCategoryEnum }))
      .query(({ input }) => getCropsByCategory(input.category)),
    
    create: publicProcedure
      .input(createCropInputSchema)
      .mutation(({ input }) => createCrop(input)),
    
    update: publicProcedure
      .input(updateCropInputSchema)
      .mutation(({ input }) => updateCrop(input)),
  }),

  // User preferences routes
  preferences: router({
    get: publicProcedure
      .input(z.object({ userId: z.number() }))
      .query(({ input }) => getUserPreferences(input.userId)),
    
    update: publicProcedure
      .input(updatePreferencesInputSchema)
      .mutation(({ input }) => updateUserPreferences(input)),
  }),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`AgriKalkulator TRPC server listening at port: ${port}`);
}

start();