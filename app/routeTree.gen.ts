/* eslint-disable */

// @ts-nocheck

// noinspection JSUnusedGlobalSymbols

// This file was automatically generated by TanStack Router.
// You should NOT make any changes in this file as it will be overwritten.
// Additionally, you should also exclude this file from your linter and/or formatter to prevent it from being checked or modified.

import { createFileRoute } from '@tanstack/react-router'

// Import Routes

import { Route as rootRoute } from './routes/__root'
import { Route as IndexImport } from './routes/index'
import { Route as SettingsIndexImport } from './routes/settings/index'
import { Route as DashboardIndexImport } from './routes/dashboard/index'
import { Route as teamsTeamsImport } from './routes/(teams)/teams'
import { Route as authLayoutImport } from './routes/(auth)/_layout'
import { Route as exercisesExercisesExerciseIdImport } from './routes/(exercises)/exercises.$exerciseId'
import { Route as authLayoutVerifyEmailImport } from './routes/(auth)/_layout.verify-email'
import { Route as authLayoutSignUpImport } from './routes/(auth)/_layout.sign-up'
import { Route as authLayoutSignInImport } from './routes/(auth)/_layout.sign-in'
import { Route as authLayoutResetPasswordImport } from './routes/(auth)/_layout.reset-password'
import { Route as exercisesExercisesExerciseIdSettingsImport } from './routes/(exercises)/exercises_.$exerciseId.settings'
import { Route as authLayoutResetPasswordTokenImport } from './routes/(auth)/_layout.reset-password_.$token'

// Create Virtual Routes

const authImport = createFileRoute('/(auth)')()

// Create/Update Routes

const authRoute = authImport.update({
  id: '/(auth)',
  getParentRoute: () => rootRoute,
} as any)

const IndexRoute = IndexImport.update({
  id: '/',
  path: '/',
  getParentRoute: () => rootRoute,
} as any)

const SettingsIndexRoute = SettingsIndexImport.update({
  id: '/settings/',
  path: '/settings/',
  getParentRoute: () => rootRoute,
} as any)

const DashboardIndexRoute = DashboardIndexImport.update({
  id: '/dashboard/',
  path: '/dashboard/',
  getParentRoute: () => rootRoute,
} as any)

const teamsTeamsRoute = teamsTeamsImport.update({
  id: '/(teams)/teams',
  path: '/teams',
  getParentRoute: () => rootRoute,
} as any)

const authLayoutRoute = authLayoutImport.update({
  id: '/_layout',
  getParentRoute: () => authRoute,
} as any)

const exercisesExercisesExerciseIdRoute =
  exercisesExercisesExerciseIdImport.update({
    id: '/(exercises)/exercises/$exerciseId',
    path: '/exercises/$exerciseId',
    getParentRoute: () => rootRoute,
  } as any)

const authLayoutVerifyEmailRoute = authLayoutVerifyEmailImport.update({
  id: '/verify-email',
  path: '/verify-email',
  getParentRoute: () => authLayoutRoute,
} as any)

const authLayoutSignUpRoute = authLayoutSignUpImport.update({
  id: '/sign-up',
  path: '/sign-up',
  getParentRoute: () => authLayoutRoute,
} as any)

const authLayoutSignInRoute = authLayoutSignInImport.update({
  id: '/sign-in',
  path: '/sign-in',
  getParentRoute: () => authLayoutRoute,
} as any)

const authLayoutResetPasswordRoute = authLayoutResetPasswordImport.update({
  id: '/reset-password',
  path: '/reset-password',
  getParentRoute: () => authLayoutRoute,
} as any)

const exercisesExercisesExerciseIdSettingsRoute =
  exercisesExercisesExerciseIdSettingsImport.update({
    id: '/(exercises)/exercises_/$exerciseId/settings',
    path: '/exercises/$exerciseId/settings',
    getParentRoute: () => rootRoute,
  } as any)

const authLayoutResetPasswordTokenRoute =
  authLayoutResetPasswordTokenImport.update({
    id: '/reset-password_/$token',
    path: '/reset-password/$token',
    getParentRoute: () => authLayoutRoute,
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
    '/(auth)': {
      id: '/(auth)'
      path: '/'
      fullPath: '/'
      preLoaderRoute: typeof authImport
      parentRoute: typeof rootRoute
    }
    '/(auth)/_layout': {
      id: '/(auth)/_layout'
      path: '/'
      fullPath: '/'
      preLoaderRoute: typeof authLayoutImport
      parentRoute: typeof authRoute
    }
    '/(teams)/teams': {
      id: '/(teams)/teams'
      path: '/teams'
      fullPath: '/teams'
      preLoaderRoute: typeof teamsTeamsImport
      parentRoute: typeof rootRoute
    }
    '/dashboard/': {
      id: '/dashboard/'
      path: '/dashboard'
      fullPath: '/dashboard'
      preLoaderRoute: typeof DashboardIndexImport
      parentRoute: typeof rootRoute
    }
    '/settings/': {
      id: '/settings/'
      path: '/settings'
      fullPath: '/settings'
      preLoaderRoute: typeof SettingsIndexImport
      parentRoute: typeof rootRoute
    }
    '/(auth)/_layout/reset-password': {
      id: '/(auth)/_layout/reset-password'
      path: '/reset-password'
      fullPath: '/reset-password'
      preLoaderRoute: typeof authLayoutResetPasswordImport
      parentRoute: typeof authLayoutImport
    }
    '/(auth)/_layout/sign-in': {
      id: '/(auth)/_layout/sign-in'
      path: '/sign-in'
      fullPath: '/sign-in'
      preLoaderRoute: typeof authLayoutSignInImport
      parentRoute: typeof authLayoutImport
    }
    '/(auth)/_layout/sign-up': {
      id: '/(auth)/_layout/sign-up'
      path: '/sign-up'
      fullPath: '/sign-up'
      preLoaderRoute: typeof authLayoutSignUpImport
      parentRoute: typeof authLayoutImport
    }
    '/(auth)/_layout/verify-email': {
      id: '/(auth)/_layout/verify-email'
      path: '/verify-email'
      fullPath: '/verify-email'
      preLoaderRoute: typeof authLayoutVerifyEmailImport
      parentRoute: typeof authLayoutImport
    }
    '/(exercises)/exercises/$exerciseId': {
      id: '/(exercises)/exercises/$exerciseId'
      path: '/exercises/$exerciseId'
      fullPath: '/exercises/$exerciseId'
      preLoaderRoute: typeof exercisesExercisesExerciseIdImport
      parentRoute: typeof rootRoute
    }
    '/(auth)/_layout/reset-password_/$token': {
      id: '/(auth)/_layout/reset-password_/$token'
      path: '/reset-password/$token'
      fullPath: '/reset-password/$token'
      preLoaderRoute: typeof authLayoutResetPasswordTokenImport
      parentRoute: typeof authLayoutImport
    }
    '/(exercises)/exercises_/$exerciseId/settings': {
      id: '/(exercises)/exercises_/$exerciseId/settings'
      path: '/exercises/$exerciseId/settings'
      fullPath: '/exercises/$exerciseId/settings'
      preLoaderRoute: typeof exercisesExercisesExerciseIdSettingsImport
      parentRoute: typeof rootRoute
    }
  }
}

// Create and export the route tree

interface authLayoutRouteChildren {
  authLayoutResetPasswordRoute: typeof authLayoutResetPasswordRoute
  authLayoutSignInRoute: typeof authLayoutSignInRoute
  authLayoutSignUpRoute: typeof authLayoutSignUpRoute
  authLayoutVerifyEmailRoute: typeof authLayoutVerifyEmailRoute
  authLayoutResetPasswordTokenRoute: typeof authLayoutResetPasswordTokenRoute
}

const authLayoutRouteChildren: authLayoutRouteChildren = {
  authLayoutResetPasswordRoute: authLayoutResetPasswordRoute,
  authLayoutSignInRoute: authLayoutSignInRoute,
  authLayoutSignUpRoute: authLayoutSignUpRoute,
  authLayoutVerifyEmailRoute: authLayoutVerifyEmailRoute,
  authLayoutResetPasswordTokenRoute: authLayoutResetPasswordTokenRoute,
}

const authLayoutRouteWithChildren = authLayoutRoute._addFileChildren(
  authLayoutRouteChildren,
)

interface authRouteChildren {
  authLayoutRoute: typeof authLayoutRouteWithChildren
}

const authRouteChildren: authRouteChildren = {
  authLayoutRoute: authLayoutRouteWithChildren,
}

const authRouteWithChildren = authRoute._addFileChildren(authRouteChildren)

export interface FileRoutesByFullPath {
  '/': typeof authLayoutRouteWithChildren
  '/teams': typeof teamsTeamsRoute
  '/dashboard': typeof DashboardIndexRoute
  '/settings': typeof SettingsIndexRoute
  '/reset-password': typeof authLayoutResetPasswordRoute
  '/sign-in': typeof authLayoutSignInRoute
  '/sign-up': typeof authLayoutSignUpRoute
  '/verify-email': typeof authLayoutVerifyEmailRoute
  '/exercises/$exerciseId': typeof exercisesExercisesExerciseIdRoute
  '/reset-password/$token': typeof authLayoutResetPasswordTokenRoute
  '/exercises/$exerciseId/settings': typeof exercisesExercisesExerciseIdSettingsRoute
}

export interface FileRoutesByTo {
  '/': typeof authLayoutRouteWithChildren
  '/teams': typeof teamsTeamsRoute
  '/dashboard': typeof DashboardIndexRoute
  '/settings': typeof SettingsIndexRoute
  '/reset-password': typeof authLayoutResetPasswordRoute
  '/sign-in': typeof authLayoutSignInRoute
  '/sign-up': typeof authLayoutSignUpRoute
  '/verify-email': typeof authLayoutVerifyEmailRoute
  '/exercises/$exerciseId': typeof exercisesExercisesExerciseIdRoute
  '/reset-password/$token': typeof authLayoutResetPasswordTokenRoute
  '/exercises/$exerciseId/settings': typeof exercisesExercisesExerciseIdSettingsRoute
}

export interface FileRoutesById {
  __root__: typeof rootRoute
  '/': typeof IndexRoute
  '/(auth)': typeof authRouteWithChildren
  '/(auth)/_layout': typeof authLayoutRouteWithChildren
  '/(teams)/teams': typeof teamsTeamsRoute
  '/dashboard/': typeof DashboardIndexRoute
  '/settings/': typeof SettingsIndexRoute
  '/(auth)/_layout/reset-password': typeof authLayoutResetPasswordRoute
  '/(auth)/_layout/sign-in': typeof authLayoutSignInRoute
  '/(auth)/_layout/sign-up': typeof authLayoutSignUpRoute
  '/(auth)/_layout/verify-email': typeof authLayoutVerifyEmailRoute
  '/(exercises)/exercises/$exerciseId': typeof exercisesExercisesExerciseIdRoute
  '/(auth)/_layout/reset-password_/$token': typeof authLayoutResetPasswordTokenRoute
  '/(exercises)/exercises_/$exerciseId/settings': typeof exercisesExercisesExerciseIdSettingsRoute
}

export interface FileRouteTypes {
  fileRoutesByFullPath: FileRoutesByFullPath
  fullPaths:
    | '/'
    | '/teams'
    | '/dashboard'
    | '/settings'
    | '/reset-password'
    | '/sign-in'
    | '/sign-up'
    | '/verify-email'
    | '/exercises/$exerciseId'
    | '/reset-password/$token'
    | '/exercises/$exerciseId/settings'
  fileRoutesByTo: FileRoutesByTo
  to:
    | '/'
    | '/teams'
    | '/dashboard'
    | '/settings'
    | '/reset-password'
    | '/sign-in'
    | '/sign-up'
    | '/verify-email'
    | '/exercises/$exerciseId'
    | '/reset-password/$token'
    | '/exercises/$exerciseId/settings'
  id:
    | '__root__'
    | '/'
    | '/(auth)'
    | '/(auth)/_layout'
    | '/(teams)/teams'
    | '/dashboard/'
    | '/settings/'
    | '/(auth)/_layout/reset-password'
    | '/(auth)/_layout/sign-in'
    | '/(auth)/_layout/sign-up'
    | '/(auth)/_layout/verify-email'
    | '/(exercises)/exercises/$exerciseId'
    | '/(auth)/_layout/reset-password_/$token'
    | '/(exercises)/exercises_/$exerciseId/settings'
  fileRoutesById: FileRoutesById
}

export interface RootRouteChildren {
  IndexRoute: typeof IndexRoute
  authRoute: typeof authRouteWithChildren
  teamsTeamsRoute: typeof teamsTeamsRoute
  DashboardIndexRoute: typeof DashboardIndexRoute
  SettingsIndexRoute: typeof SettingsIndexRoute
  exercisesExercisesExerciseIdRoute: typeof exercisesExercisesExerciseIdRoute
  exercisesExercisesExerciseIdSettingsRoute: typeof exercisesExercisesExerciseIdSettingsRoute
}

const rootRouteChildren: RootRouteChildren = {
  IndexRoute: IndexRoute,
  authRoute: authRouteWithChildren,
  teamsTeamsRoute: teamsTeamsRoute,
  DashboardIndexRoute: DashboardIndexRoute,
  SettingsIndexRoute: SettingsIndexRoute,
  exercisesExercisesExerciseIdRoute: exercisesExercisesExerciseIdRoute,
  exercisesExercisesExerciseIdSettingsRoute:
    exercisesExercisesExerciseIdSettingsRoute,
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
        "/(auth)",
        "/(teams)/teams",
        "/dashboard/",
        "/settings/",
        "/(exercises)/exercises/$exerciseId",
        "/(exercises)/exercises_/$exerciseId/settings"
      ]
    },
    "/": {
      "filePath": "index.tsx"
    },
    "/(auth)": {
      "filePath": "(auth)",
      "children": [
        "/(auth)/_layout"
      ]
    },
    "/(auth)/_layout": {
      "filePath": "(auth)/_layout.tsx",
      "parent": "/(auth)",
      "children": [
        "/(auth)/_layout/reset-password",
        "/(auth)/_layout/sign-in",
        "/(auth)/_layout/sign-up",
        "/(auth)/_layout/verify-email",
        "/(auth)/_layout/reset-password_/$token"
      ]
    },
    "/(teams)/teams": {
      "filePath": "(teams)/teams.tsx"
    },
    "/dashboard/": {
      "filePath": "dashboard/index.tsx"
    },
    "/settings/": {
      "filePath": "settings/index.tsx"
    },
    "/(auth)/_layout/reset-password": {
      "filePath": "(auth)/_layout.reset-password.tsx",
      "parent": "/(auth)/_layout"
    },
    "/(auth)/_layout/sign-in": {
      "filePath": "(auth)/_layout.sign-in.tsx",
      "parent": "/(auth)/_layout"
    },
    "/(auth)/_layout/sign-up": {
      "filePath": "(auth)/_layout.sign-up.tsx",
      "parent": "/(auth)/_layout"
    },
    "/(auth)/_layout/verify-email": {
      "filePath": "(auth)/_layout.verify-email.tsx",
      "parent": "/(auth)/_layout"
    },
    "/(exercises)/exercises/$exerciseId": {
      "filePath": "(exercises)/exercises.$exerciseId.tsx"
    },
    "/(auth)/_layout/reset-password_/$token": {
      "filePath": "(auth)/_layout.reset-password_.$token.tsx",
      "parent": "/(auth)/_layout"
    },
    "/(exercises)/exercises_/$exerciseId/settings": {
      "filePath": "(exercises)/exercises_.$exerciseId.settings.tsx"
    }
  }
}
ROUTE_MANIFEST_END */
