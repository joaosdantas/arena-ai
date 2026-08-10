import { Building2, ChevronsUpDown, LogOut, Moon, Sun } from 'lucide-react'

import { useNavigate } from 'react-router-dom'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/theme-context'

import { appPaths } from '@/routes/paths'

function getInitials(name?: string | null, email?: string | null): string {
  const source = name ?? email ?? '?'
  return source
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('')
}

export function UserMenu() {
  const { user, profile, signOut } = useAuth()
  const { resolvedTheme, toggleTheme } = useTheme()
  const navigate = useNavigate()

  const displayName = profile?.fullName || user?.email || 'Convidado'
  const email = user?.email

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="hover:bg-accent flex items-center gap-2 rounded-full p-1 pr-2 text-sm font-medium outline-none"
        >
          <Avatar className="size-8">
            <AvatarImage src={profile?.avatarUrl ?? undefined} alt={displayName} />
            <AvatarFallback>{getInitials(displayName, email)}</AvatarFallback>
          </Avatar>
          <ChevronsUpDown className="text-muted-foreground size-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="space-y-1">
          <p className="text-sm font-medium">{displayName}</p>
          {email ? <p className="text-muted-foreground text-xs font-normal">{email}</p> : null}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => navigate(appPaths.profile)}>Perfil</DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigate(appPaths.dashboard)}>Dashboard</DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigate(appPaths.arena)}>
          <Building2 className="size-4" />
          Minha Arena
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => void toggleTheme()}>
          {resolvedTheme === 'dark' ? <Sun className="size-4" /> : <Moon className="size-4" />}
          Tema {resolvedTheme === 'dark' ? 'claro' : 'escuro'}
        </DropdownMenuItem>
        <DropdownMenuItem
          variant="destructive"
          onClick={() => void signOut().then(() => navigate(appPaths.login))}
        >
          <LogOut className="size-4" />
          Sair
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
