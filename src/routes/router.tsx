import { Navigate, createBrowserRouter } from 'react-router-dom'

import { AppLayout } from '@/layouts/AppLayout'
import { AuthLayout } from '@/layouts/auth-layout'

import { ArenaAccessGuard, ArenaLayout } from '@/modules/arena'
import { PublicRoute } from '@/modules/auth/components/public-route'
import { CaptureDevicePage } from '@/modules/capture/pages/capture-device-page'
import { CapturePairingPage } from '@/modules/capture/pages/capture-pairing-page'
import { CaptureRoomPage } from '@/modules/capture/pages/capture-room-page'
import {
  PlayerHomePage,
  PlayerLayout,
  PlayerMatchDetailPage,
  PlayerVideoPage,
  PublicWatchPage,
} from '@/modules/player'

import { ArenaCourtsPage } from '@/pages/arena-courts-page'
import { ArenaDashboardPage } from '@/pages/arena-dashboard-page'
import { ArenaDevicesPage } from '@/pages/arena-devices-page'
import { ArenaSessionDetailPage } from '@/pages/arena-session-detail-page'
import { ArenaSessionsPage } from '@/pages/arena-sessions-page'
import { ArenaSettingsPage } from '@/pages/arena-settings-page'
import { DashboardPage } from '@/pages/dashboard-page'
import { LoginPage } from '@/pages/login-page'
import { MatchDetailPage } from '@/pages/match-detail-page'
import { MatchEditPage } from '@/pages/match-edit-page'
import { MatchesPage } from '@/pages/matches-page'
import { NewArenaPage } from '@/pages/new-arena-page'
import { NewMatchPage } from '@/pages/new-match-page'
import { ProfilePage } from '@/pages/profile-page'
import { PublicMatchPage } from '@/pages/public-match-page'
import { RecoverPasswordPage } from '@/pages/recover-password-page'
import { RegisterPage } from '@/pages/register-page'
import { VideoDetailsPage } from '@/pages/video-details-page'

import { ProtectedRoute } from '@/routes/ProtectedRoute'
import { appPaths } from '@/routes/paths'

export const router = createBrowserRouter([
  {
    element: <AuthLayout />,
    children: [
      {
        element: <PublicRoute />,
        children: [
          {
            path: appPaths.login,
            element: <LoginPage />,
          },
          {
            path: appPaths.register,
            element: <RegisterPage />,
          },
          {
            path: appPaths.recover,
            element: <RecoverPasswordPage />,
          },
        ],
      },
    ],
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          {
            path: appPaths.dashboard,
            element: <DashboardPage />,
          },
          {
            path: appPaths.matches,
            element: <MatchesPage />,
          },
          {
            path: appPaths.matchesNew,
            element: <NewMatchPage />,
          },
          {
            path: '/matches/:id',
            element: <MatchDetailPage />,
          },
          {
            path: '/matches/:id/edit',
            element: <MatchEditPage />,
          },
          {
            path: '/videos/:id',
            element: <VideoDetailsPage />,
          },
          {
            path: appPaths.profile,
            element: <ProfilePage />,
          },
          {
            path: '*',
            element: <Navigate to={appPaths.dashboard} replace />,
          },
        ],
      },
      {
        element: <PlayerLayout />,
        children: [
          {
            path: appPaths.player,
            element: <PlayerHomePage />,
          },
          {
            path: '/player/matches/:id',
            element: <PlayerMatchDetailPage />,
          },
          {
            path: '/player/videos/:id',
            element: <PlayerVideoPage />,
          },
        ],
      },
      {
        path: appPaths.arena,
        children: [
          {
            path: appPaths.arenaNew,
            element: <NewArenaPage />,
          },
          {
            element: <ArenaAccessGuard />,
            children: [
              {
                element: <ArenaLayout />,
                children: [
                  {
                    index: true,
                    element: <ArenaDashboardPage />,
                  },
                  {
                    path: 'courts',
                    element: <ArenaCourtsPage />,
                  },
                  {
                    path: 'devices',
                    element: <ArenaDevicesPage />,
                  },
                  {
                    path: 'sessions',
                    element: <ArenaSessionsPage />,
                  },
                  {
                    path: 'sessions/:id',
                    element: <ArenaSessionDetailPage />,
                  },
                  {
                    path: 'settings',
                    element: <ArenaSettingsPage />,
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
  {
    path: appPaths.publicMatch(':id'),
    element: <PublicMatchPage />,
  },
  {
    path: '/capture/room/:roomToken',
    element: <CaptureRoomPage />,
  },
  {
    path: '/capture/device/:id',
    element: <CaptureDevicePage />,
  },
  {
    path: '/capture/:pairingToken',
    element: <CapturePairingPage />,
  },
  {
    path: '/watch/:videoId',
    element: <PublicWatchPage />,
  },
])
