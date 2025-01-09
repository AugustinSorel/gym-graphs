/* eslint-disable */

// @ts-nocheck

// noinspection JSUnusedGlobalSymbols

// This file was automatically generated by TanStack Router.
// You should NOT make any changes in this file as it will be overwritten.
// Additionally, you should also exclude this file from your linter and/or formatter to prevent it from being checked or modified.

// Import Routes

import { Route as rootRoute } from './routes/__root'
import { Route as SettingsImport } from './routes/settings'
import { Route as DashboardImport } from './routes/dashboard'
import { Route as AuthImport } from './routes/_auth'
import { Route as IndexImport } from './routes/index'
import { Route as ExercisesExerciseIdImport } from './routes/exercises.$exerciseId'
import { Route as AuthSignUpImport } from './routes/_auth.sign-up'
import { Route as AuthSignInImport } from './routes/_auth.sign-in'
import { Route as ExercisesExerciseIdSettingsImport } from './routes/exercises_/$exerciseId.settings'

// Create/Update Routes

const SettingsRoute = SettingsImport.update({
  id: '/settings',
  path: '/settings',
  getParentRoute: () => rootRoute,
} as any)

const DashboardRoute = DashboardImport.update({
  id: '/dashboard',
  path: '/dashboard',
  getParentRoute: () => rootRoute,
} as any)

const AuthRoute = AuthImport.update({
  id: '/_auth',
  getParentRoute: () => rootRoute,
} as any)

const IndexRoute = IndexImport.update({
  id: '/',
  path: '/',
  getParentRoute: () => rootRoute,
} as any)

const ExercisesExerciseIdRoute = ExercisesExerciseIdImport.update({
  id: '/exercises/$exerciseId',
  path: '/exercises/$exerciseId',
  getParentRoute: () => rootRoute,
} as any)

const AuthSignUpRoute = AuthSignUpImport.update({
  id: '/sign-up',
  path: '/sign-up',
  getParentRoute: () => AuthRoute,
} as any)

const AuthSignInRoute = AuthSignInImport.update({
  id: '/sign-in',
  path: '/sign-in',
  getParentRoute: () => AuthRoute,
} as any)

const ExercisesExerciseIdSettingsRoute =
  ExercisesExerciseIdSettingsImport.update({
    id: '/exercises_/$exerciseId/settings',
    path: '/exercises/$exerciseId/settings',
    getParentRoute: () => rootRoute,
  } as any)

// Populate the FileRoutesByPath interface

declare module '@tanstack/react-router' {
  interface FileRoutesByPath {
    '/': {
      id: '/'
      path: '/'
      fullPath: '/'
      preLoaderRoute: typeof IndexImport
      parentRoute: typeof rootRoute
    }
    '/_auth': {
      id: '/_auth'
      path: ''
      fullPath: ''
      preLoaderRoute: typeof AuthImport
      parentRoute: typeof rootRoute
    }
    '/dashboard': {
      id: '/dashboard'
      path: '/dashboard'
      fullPath: '/dashboard'
      preLoaderRoute: typeof DashboardImport
      parentRoute: typeof rootRoute
    }
    '/settings': {
      id: '/settings'
      path: '/settings'
      fullPath: '/settings'
      preLoaderRoute: typeof SettingsImport
      parentRoute: typeof rootRoute
    }
    '/_auth/sign-in': {
      id: '/_auth/sign-in'
      path: '/sign-in'
      fullPath: '/sign-in'
      preLoaderRoute: typeof AuthSignInImport
      parentRoute: typeof AuthImport
    }
    '/_auth/sign-up': {
      id: '/_auth/sign-up'
      path: '/sign-up'
      fullPath: '/sign-up'
      preLoaderRoute: typeof AuthSignUpImport
      parentRoute: typeof AuthImport
    }
    '/exercises/$exerciseId': {
      id: '/exercises/$exerciseId'
      path: '/exercises/$exerciseId'
      fullPath: '/exercises/$exerciseId'
      preLoaderRoute: typeof ExercisesExerciseIdImport
      parentRoute: typeof rootRoute
    }
    '/exercises_/$exerciseId/settings': {
      id: '/exercises_/$exerciseId/settings'
      path: '/exercises/$exerciseId/settings'
      fullPath: '/exercises/$exerciseId/settings'
      preLoaderRoute: typeof ExercisesExerciseIdSettingsImport
      parentRoute: typeof rootRoute
    }
  }
}

// Create and export the route tree

interface AuthRouteChildren {
  AuthSignInRoute: typeof AuthSignInRoute
  AuthSignUpRoute: typeof AuthSignUpRoute
}

const AuthRouteChildren: AuthRouteChildren = {
  AuthSignInRoute: AuthSignInRoute,
  AuthSignUpRoute: AuthSignUpRoute,
}

const AuthRouteWithChildren = AuthRoute._addFileChildren(AuthRouteChildren)

export interface FileRoutesByFullPath {
  '/': typeof IndexRoute
  '': typeof AuthRouteWithChildren
  '/dashboard': typeof DashboardRoute
  '/settings': typeof SettingsRoute
  '/sign-in': typeof AuthSignInRoute
  '/sign-up': typeof AuthSignUpRoute
  '/exercises/$exerciseId': typeof ExercisesExerciseIdRoute
  '/exercises/$exerciseId/settings': typeof ExercisesExerciseIdSettingsRoute
}

export interface FileRoutesByTo {
  '/': typeof IndexRoute
  '': typeof AuthRouteWithChildren
  '/dashboard': typeof DashboardRoute
  '/settings': typeof SettingsRoute
  '/sign-in': typeof AuthSignInRoute
  '/sign-up': typeof AuthSignUpRoute
  '/exercises/$exerciseId': typeof ExercisesExerciseIdRoute
  '/exercises/$exerciseId/settings': typeof ExercisesExerciseIdSettingsRoute
}

export interface FileRoutesById {
  __root__: typeof rootRoute
  '/': typeof IndexRoute
  '/_auth': typeof AuthRouteWithChildren
  '/dashboard': typeof DashboardRoute
  '/settings': typeof SettingsRoute
  '/_auth/sign-in': typeof AuthSignInRoute
  '/_auth/sign-up': typeof AuthSignUpRoute
  '/exercises/$exerciseId': typeof ExercisesExerciseIdRoute
  '/exercises_/$exerciseId/settings': typeof ExercisesExerciseIdSettingsRoute
}

export interface FileRouteTypes {
  fileRoutesByFullPath: FileRoutesByFullPath
  fullPaths:
    | '/'
    | ''
    | '/dashboard'
    | '/settings'
    | '/sign-in'
    | '/sign-up'
    | '/exercises/$exerciseId'
    | '/exercises/$exerciseId/settings'
  fileRoutesByTo: FileRoutesByTo
  to:
    | '/'
    | ''
    | '/dashboard'
    | '/settings'
    | '/sign-in'
    | '/sign-up'
    | '/exercises/$exerciseId'
    | '/exercises/$exerciseId/settings'
  id:
    | '__root__'
    | '/'
    | '/_auth'
    | '/dashboard'
    | '/settings'
    | '/_auth/sign-in'
    | '/_auth/sign-up'
    | '/exercises/$exerciseId'
    | '/exercises_/$exerciseId/settings'
  fileRoutesById: FileRoutesById
}

export interface RootRouteChildren {
  IndexRoute: typeof IndexRoute
  AuthRoute: typeof AuthRouteWithChildren
  DashboardRoute: typeof DashboardRoute
  SettingsRoute: typeof SettingsRoute
  ExercisesExerciseIdRoute: typeof ExercisesExerciseIdRoute
  ExercisesExerciseIdSettingsRoute: typeof ExercisesExerciseIdSettingsRoute
}

const rootRouteChildren: RootRouteChildren = {
  IndexRoute: IndexRoute,
  AuthRoute: AuthRouteWithChildren,
  DashboardRoute: DashboardRoute,
  SettingsRoute: SettingsRoute,
  ExercisesExerciseIdRoute: ExercisesExerciseIdRoute,
  ExercisesExerciseIdSettingsRoute: ExercisesExerciseIdSettingsRoute,
}

export const routeTree = rootRoute
  ._addFileChildren(rootRouteChildren)
  ._addFileTypes<FileRouteTypes>()

/* ROUTE_MANIFEST_START
{
  "routes": {
    "__root__": {
      "filePath": "__root.tsx",
      "children": [
        "/",
        "/_auth",
        "/dashboard",
        "/settings",
        "/exercises/$exerciseId",
        "/exercises_/$exerciseId/settings"
      ]
    },
    "/": {
      "filePath": "index.tsx"
    },
    "/_auth": {
      "filePath": "_auth.tsx",
      "children": [
        "/_auth/sign-in",
        "/_auth/sign-up"
      ]
    },
    "/dashboard": {
      "filePath": "dashboard.tsx"
    },
    "/settings": {
      "filePath": "settings.tsx"
    },
    "/_auth/sign-in": {
      "filePath": "_auth.sign-in.tsx",
      "parent": "/_auth"
    },
    "/_auth/sign-up": {
      "filePath": "_auth.sign-up.tsx",
      "parent": "/_auth"
    },
    "/exercises/$exerciseId": {
      "filePath": "exercises.$exerciseId.tsx"
    },
    "/exercises_/$exerciseId/settings": {
      "filePath": "exercises_/$exerciseId.settings.tsx"
    }
  }
}
ROUTE_MANIFEST_END */
