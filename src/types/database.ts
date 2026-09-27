export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  public: {
    Tables: {
      arenas: {
        Row: {
          address: string | null
          city: string | null
          cover_url: string | null
          created_at: string
          id: string
          name: string
          owner_id: string | null
          slug: string | null
          state: string | null
          status: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          city?: string | null
          cover_url?: string | null
          created_at?: string
          id?: string
          name: string
          owner_id?: string | null
          slug?: string | null
          state?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          city?: string | null
          cover_url?: string | null
          created_at?: string
          id?: string
          name?: string
          owner_id?: string | null
          slug?: string | null
          state?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'arenas_owner_id_fkey'
            columns: ['owner_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
        ]
      }
      capture_devices: {
        Row: {
          angle: number | null
          capture_installation_id: string | null
          court_id: string
          created_at: string
          height: number | null
          id: string
          last_seen: string | null
          name: string
          paired: boolean
          pairing_token: string
          position: string | null
          qr_code: string
          session_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          angle?: number | null
          capture_installation_id?: string | null
          court_id: string
          created_at?: string
          height?: number | null
          id?: string
          last_seen?: string | null
          name: string
          paired?: boolean
          pairing_token: string
          position?: string | null
          qr_code: string
          session_id?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          angle?: number | null
          capture_installation_id?: string | null
          court_id?: string
          created_at?: string
          height?: number | null
          id?: string
          last_seen?: string | null
          name?: string
          paired?: boolean
          pairing_token?: string
          position?: string | null
          qr_code?: string
          session_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'capture_devices_court_id_fkey'
            columns: ['court_id']
            isOneToOne: false
            referencedRelation: 'courts'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'capture_devices_session_id_fkey'
            columns: ['session_id']
            isOneToOne: false
            referencedRelation: 'sessions'
            referencedColumns: ['id']
          },
        ]
      }
      courts: {
        Row: {
          arena_id: string
          created_at: string
          id: string
          name: string
          sport: string | null
          status: string
          updated_at: string
        }
        Insert: {
          arena_id: string
          created_at?: string
          id?: string
          name: string
          sport?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          arena_id?: string
          created_at?: string
          id?: string
          name?: string
          sport?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'courts_arena_id_fkey'
            columns: ['arena_id']
            isOneToOne: false
            referencedRelation: 'arenas'
            referencedColumns: ['id']
          },
        ]
      }
      clips: {
        Row: {
          created_at: string
          end_time: number
          id: string
          match_id: string
          start_time: number
          title: string
          video_url: string | null
        }
        Insert: {
          created_at?: string
          end_time: number
          id?: string
          match_id: string
          start_time: number
          title: string
          video_url?: string | null
        }
        Update: {
          created_at?: string
          end_time?: number
          id?: string
          match_id?: string
          start_time?: number
          title?: string
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'clips_match_id_fkey'
            columns: ['match_id']
            isOneToOne: false
            referencedRelation: 'matches'
            referencedColumns: ['id']
          },
        ]
      }
      matches: {
        Row: {
          arena_id: string | null
          created_at: string
          description: string | null
          finished_at: string | null
          id: string
          is_public: boolean
          owner_id: string
          preview_url: string | null
          scheduled_at: string | null
          session_id: string | null
          sport: string
          started_at: string | null
          status: Database['public']['Enums']['match_status']
          thumbnail_url: string | null
          title: string
          video_url: string | null
        }
        Insert: {
          arena_id?: string | null
          created_at?: string
          description?: string | null
          finished_at?: string | null
          id?: string
          is_public?: boolean
          owner_id: string
          preview_url?: string | null
          scheduled_at?: string | null
          sport: string
          started_at?: string | null
          status?: Database['public']['Enums']['match_status']
          thumbnail_url?: string | null
          title: string
          video_url?: string | null
        }
        Update: {
          arena_id?: string | null
          created_at?: string
          description?: string | null
          finished_at?: string | null
          id?: string
          is_public?: boolean
          owner_id?: string
          preview_url?: string | null
          scheduled_at?: string | null
          session_id?: string | null
          sport?: string
          started_at?: string | null
          status?: Database['public']['Enums']['match_status']
          thumbnail_url?: string | null
          title?: string
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'matches_owner_id_fkey'
            columns: ['owner_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'matches_arena_id_fkey'
            columns: ['arena_id']
            isOneToOne: false
            referencedRelation: 'arenas'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'matches_session_id_fkey'
            columns: ['session_id']
            isOneToOne: false
            referencedRelation: 'sessions'
            referencedColumns: ['id']
          },
        ]
      }
      players: {
        Row: {
          created_at: string
          id: string
          match_id: string
          name: string
          team: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          match_id: string
          name: string
          team?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          match_id?: string
          name?: string
          team?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'players_match_id_fkey'
            columns: ['match_id']
            isOneToOne: false
            referencedRelation: 'matches'
            referencedColumns: ['id']
          },
        ]
      }
      sessions: {
        Row: {
          court_id: string
          created_at: string
          created_by: string | null
          ended_at: string | null
          id: string
          started_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          court_id: string
          created_at?: string
          created_by?: string | null
          ended_at?: string | null
          id?: string
          started_at?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          court_id?: string
          created_at?: string
          created_by?: string | null
          ended_at?: string | null
          id?: string
          started_at?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'sessions_court_id_fkey'
            columns: ['court_id']
            isOneToOne: false
            referencedRelation: 'courts'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'sessions_created_by_fkey'
            columns: ['created_by']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
        ]
      }
      users: {
        Row: {
          avatar_url: string | null
          created_at: string
          id: string
          name: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          id: string
          name: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: 'users_id_fkey'
            columns: ['id']
            isOneToOne: true
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
        ]
      }
      videos: {
        Row: {
          capture_device_id: string | null
          codec: string | null
          created_at: string
          duration: number | null
          file_size: number | null
          fps: number | null
          height: number | null
          id: string
          match_id: string | null
          mime_type: string | null
          original_url: string
          preview_url: string | null
          processing_status: Database['public']['Enums']['video_processing_status']
          recording_ended_at: string | null
          recording_started_at: string | null
          session_id: string | null
          thumbnail_url: string | null
          timeline_offset_ms: number
          width: number | null
        }
        Insert: {
          capture_device_id?: string | null
          codec?: string | null
          created_at?: string
          duration?: number | null
          file_size?: number | null
          fps?: number | null
          height?: number | null
          id?: string
          match_id?: string | null
          mime_type?: string | null
          original_url: string
          preview_url?: string | null
          processing_status?: Database['public']['Enums']['video_processing_status']
          recording_ended_at?: string | null
          recording_started_at?: string | null
          session_id?: string | null
          thumbnail_url?: string | null
          timeline_offset_ms?: number
          width?: number | null
        }
        Update: {
          capture_device_id?: string | null
          codec?: string | null
          created_at?: string
          duration?: number | null
          file_size?: number | null
          fps?: number | null
          height?: number | null
          id?: string
          match_id?: string | null
          mime_type?: string | null
          original_url?: string
          preview_url?: string | null
          processing_status?: Database['public']['Enums']['video_processing_status']
          recording_ended_at?: string | null
          recording_started_at?: string | null
          session_id?: string | null
          thumbnail_url?: string | null
          timeline_offset_ms?: number
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: 'videos_match_id_fkey'
            columns: ['match_id']
            isOneToOne: false
            referencedRelation: 'matches'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'videos_session_id_fkey'
            columns: ['session_id']
            isOneToOne: false
            referencedRelation: 'sessions'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'videos_capture_device_id_fkey'
            columns: ['capture_device_id']
            isOneToOne: false
            referencedRelation: 'capture_devices'
            referencedColumns: ['id']
          },
        ]
      }
    }
    Views: Record<string, never>
    Functions: {
      start_capture_video: {
        Args: {
          p_device_id: string
          p_installation_id: string
          p_session_id: string
          p_mime_type?: string | null
          p_match_id?: string | null
        }
        Returns: { video_id: string; storage_path: string; recording_started_at: string; timeline_offset_ms: number }[]
      }
      finish_capture_video: {
        Args: { p_video_id: string; p_installation_id: string; p_duration: number; p_file_size?: number | null; p_mime_type?: string | null }
        Returns: boolean
      }
      get_active_capture_session: {
        Args: {
          p_device_id: string
          p_installation_id: string
        }
        Returns: {
          arena_name: string
          court_name: string
          session_id: string
          started_at: string | null
          status: string
        }[]
      }
      get_capture_device_by_id: {
        Args: {
          p_device_id: string
          p_installation_id?: string
        }
        Returns: {
          arena_name: string
          court_name: string
          id: string
          is_mine: boolean
          name: string
          paired: boolean
          position: string | null
        }[]
      }
      get_capture_device_by_token: {
        Args: {
          p_token: string
          p_installation_id?: string
        }
        Returns: {
          arena_name: string
          court_name: string
          id: string
          is_mine: boolean
          name: string
          paired: boolean
          position: string | null
        }[]
      }
      get_public_video: {
        Args: {
          p_video_id: string
        }
        Returns: {
          video_id: string
          processing_status: string
          duration: number | null
          original_url: string
          thumbnail_url: string | null
          preview_url: string | null
          match_id: string
          match_title: string
          sport: string
          scheduled_at: string | null
          arena_name: string | null
          court_name: string | null
        }[]
      }
      create_capture_video: {
        Args: {
          p_device_id: string
          p_installation_id: string
          p_session_id: string
          p_mime_type?: string | null
          p_file_size?: number | null
          p_duration?: number | null
          p_match_id?: string | null
        }
        Returns: {
          video_id: string
          storage_path: string
        }[]
      }
      pair_capture_device: {
        Args: {
          p_token: string
          p_installation_id: string
        }
        Returns: boolean
      }
      recalculate_session_status: {
        Args: {
          p_session_id: string
        }
        Returns: undefined
      }
      send_capture_device_heartbeat: {
        Args: {
          p_device_id: string
          p_installation_id: string
        }
        Returns: boolean
      }
      set_capture_device_status: {
        Args: {
          p_device_id: string
          p_installation_id: string
          p_status: string
        }
        Returns: boolean
      }
      update_capture_video_status: {
        Args: {
          p_video_id: string
          p_installation_id: string
          p_status: string
        }
        Returns: boolean
      }
    }
    Enums: {
      match_status: 'created' | 'recording' | 'uploading' | 'processing' | 'ready' | 'failed'
      video_processing_status: 'pending' | 'uploading' | 'processing' | 'ready' | 'failed'
    }
    CompositeTypes: Record<string, never>
  }
}

type DefaultSchema = Database[Extract<keyof Database, 'public'>]

export type Table<
  DefaultSchemaTableNameOrOptions extends
    keyof (Database['public']['Tables'] & DefaultSchema['Tables']) | { schema: keyof Database },
> = keyof DefaultSchema extends keyof DefaultSchema
  ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
      ? DefaultSchemaTableNameOrOptions
      : never]
  : never

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    keyof (Database['public']['Tables'] & DefaultSchema['Tables']) | { schema: keyof Database },
> = keyof DefaultSchema extends keyof DefaultSchema
  ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
      ? DefaultSchemaTableNameOrOptions
      : never] extends infer T
    ? T extends { Row: infer Row }
      ? Row
      : never
    : never
  : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof (Database['public']['Tables'] & DefaultSchema['Tables']) | { schema: keyof Database },
> = keyof DefaultSchema extends keyof DefaultSchema
  ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
      ? DefaultSchemaTableNameOrOptions
      : never] extends infer T
    ? T extends { Insert: infer Insert }
      ? Insert
      : never
    : never
  : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof (Database['public']['Tables'] & DefaultSchema['Tables']) | { schema: keyof Database },
> = keyof DefaultSchema extends keyof DefaultSchema
  ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
      ? DefaultSchemaTableNameOrOptions
      : never] extends infer T
    ? T extends { Update: infer Update }
      ? Update
      : never
    : never
  : never

export type Enums<DefaultSchemaEnumName extends keyof Database['public']['Enums']> =
  Database['public']['Enums'][DefaultSchemaEnumName]
