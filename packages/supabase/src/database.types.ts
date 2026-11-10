export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      addresses: {
        Row: {
          id: string
          order_id: string
          role: Database["public"]["Enums"]["address_role"]
          sort_order: number
        }
        Insert: {
          id?: string
          order_id: string
          role: Database["public"]["Enums"]["address_role"]
          sort_order: number
        }
        Update: {
          id?: string
          order_id?: string
          role?: Database["public"]["Enums"]["address_role"]
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "addresses_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_log: {
        Row: {
          action: string
          actor_id: string | null
          actor_type: string
          company_id: string | null
          data: Json
          entity: string
          entity_id: string
          id: number
          occurred_at: string
        }
        Insert: {
          action: string
          actor_id?: string | null
          actor_type: string
          company_id?: string | null
          data?: Json
          entity: string
          entity_id: string
          id?: never
          occurred_at?: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          actor_type?: string
          company_id?: string | null
          data?: Json
          entity?: string
          entity_id?: string
          id?: never
          occurred_at?: string
        }
        Relationships: []
      }
      catalog_categories: {
        Row: {
          active: boolean
          created_at: string
          icon: string | null
          id: string
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          icon?: string | null
          id?: string
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          icon?: string | null
          id?: string
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      catalog_category_translations: {
        Row: {
          category_id: string
          description: string | null
          locale: Database["public"]["Enums"]["app_locale"]
          name: string
        }
        Insert: {
          category_id: string
          description?: string | null
          locale: Database["public"]["Enums"]["app_locale"]
          name: string
        }
        Update: {
          category_id?: string
          description?: string | null
          locale?: Database["public"]["Enums"]["app_locale"]
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "catalog_category_translations_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "catalog_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      catalog_item_rooms: {
        Row: {
          item_id: string
          room_id: string
        }
        Insert: {
          item_id: string
          room_id: string
        }
        Update: {
          item_id?: string
          room_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "catalog_item_rooms_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "catalog_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "catalog_item_rooms_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "catalog_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      catalog_item_translations: {
        Row: {
          item_id: string
          locale: Database["public"]["Enums"]["app_locale"]
          name: string
          synonyms: string | null
        }
        Insert: {
          item_id: string
          locale: Database["public"]["Enums"]["app_locale"]
          name: string
          synonyms?: string | null
        }
        Update: {
          item_id?: string
          locale?: Database["public"]["Enums"]["app_locale"]
          name?: string
          synonyms?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "catalog_item_translations_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "catalog_items"
            referencedColumns: ["id"]
          },
        ]
      }
      catalog_items: {
        Row: {
          active: boolean
          category_id: string
          created_at: string
          handling_flags: Database["public"]["Enums"]["handling_flag"][]
          handling_minutes: number
          icon: string | null
          id: string
          max_dimension_cm: number | null
          slug: string
          sort_order: number
          updated_at: string
          volume_m3: number
          weight_kg: number | null
        }
        Insert: {
          active?: boolean
          category_id: string
          created_at?: string
          handling_flags?: Database["public"]["Enums"]["handling_flag"][]
          handling_minutes?: number
          icon?: string | null
          id?: string
          max_dimension_cm?: number | null
          slug: string
          sort_order?: number
          updated_at?: string
          volume_m3: number
          weight_kg?: number | null
        }
        Update: {
          active?: boolean
          category_id?: string
          created_at?: string
          handling_flags?: Database["public"]["Enums"]["handling_flag"][]
          handling_minutes?: number
          icon?: string | null
          id?: string
          max_dimension_cm?: number | null
          slug?: string
          sort_order?: number
          updated_at?: string
          volume_m3?: number
          weight_kg?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "catalog_items_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "catalog_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      catalog_room_translations: {
        Row: {
          locale: Database["public"]["Enums"]["app_locale"]
          name: string
          room_id: string
        }
        Insert: {
          locale: Database["public"]["Enums"]["app_locale"]
          name: string
          room_id: string
        }
        Update: {
          locale?: Database["public"]["Enums"]["app_locale"]
          name?: string
          room_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "catalog_room_translations_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "catalog_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      catalog_rooms: {
        Row: {
          active: boolean
          created_at: string
          icon: string | null
          id: string
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          icon?: string | null
          id?: string
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          icon?: string | null
          id?: string
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      clients: {
        Row: {
          company_id: string
          created_at: string
          email: string | null
          id: string
          name: string
          phone: string
          tax_id: string | null
          type: Database["public"]["Enums"]["client_type"]
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          email?: string | null
          id?: string
          name: string
          phone: string
          tax_id?: string | null
          type?: Database["public"]["Enums"]["client_type"]
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          phone?: string
          tax_id?: string | null
          type?: Database["public"]["Enums"]["client_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "clients_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          base_address: string | null
          country_code: string
          created_at: string
          deactivated_at: string | null
          deactivation_reason: string | null
          gdpr_signed_on: string | null
          gdpr_version: string | null
          general_email: string | null
          id: string
          imt_reference: string | null
          imt_verified_on: string | null
          logo_path: string | null
          phone: string | null
          tax_id: string
          trade_name: string
          updated_at: string
        }
        Insert: {
          base_address?: string | null
          country_code?: string
          created_at?: string
          deactivated_at?: string | null
          deactivation_reason?: string | null
          gdpr_signed_on?: string | null
          gdpr_version?: string | null
          general_email?: string | null
          id?: string
          imt_reference?: string | null
          imt_verified_on?: string | null
          logo_path?: string | null
          phone?: string | null
          tax_id: string
          trade_name: string
          updated_at?: string
        }
        Update: {
          base_address?: string | null
          country_code?: string
          created_at?: string
          deactivated_at?: string | null
          deactivation_reason?: string | null
          gdpr_signed_on?: string | null
          gdpr_version?: string | null
          general_email?: string | null
          id?: string
          imt_reference?: string | null
          imt_verified_on?: string | null
          logo_path?: string | null
          phone?: string | null
          tax_id?: string
          trade_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      company_internal: {
        Row: {
          company_id: string
          notes: string | null
          region: string | null
          source: string | null
          updated_at: string
        }
        Insert: {
          company_id: string
          notes?: string | null
          region?: string | null
          source?: string | null
          updated_at?: string
        }
        Update: {
          company_id?: string
          notes?: string | null
          region?: string | null
          source?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_internal_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: true
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      company_users: {
        Row: {
          active: boolean
          company_id: string
          created_at: string
          id: string
          name: string
          phone: string | null
          role: Database["public"]["Enums"]["company_role"]
          updated_at: string
        }
        Insert: {
          active?: boolean
          company_id: string
          created_at?: string
          id: string
          name: string
          phone?: string | null
          role: Database["public"]["Enums"]["company_role"]
          updated_at?: string
        }
        Update: {
          active?: boolean
          company_id?: string
          created_at?: string
          id?: string
          name?: string
          phone?: string | null
          role?: Database["public"]["Enums"]["company_role"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_users_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      inventories: {
        Row: {
          created_at: string
          filled_by: Database["public"]["Enums"]["filled_by"]
          id: string
          order_id: string
          submitted_at: string | null
          updated_at: string
          version: number
        }
        Insert: {
          created_at?: string
          filled_by: Database["public"]["Enums"]["filled_by"]
          id?: string
          order_id: string
          submitted_at?: string | null
          updated_at?: string
          version: number
        }
        Update: {
          created_at?: string
          filled_by?: Database["public"]["Enums"]["filled_by"]
          id?: string
          order_id?: string
          submitted_at?: string | null
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "inventories_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_addresses: {
        Row: {
          address: string
          address_id: string
          floor: number
          id: string
          inventory_id: string
          lat: number | null
          lift: Database["public"]["Enums"]["lift_size"]
          lng: number | null
          narrow_stairs: boolean
          needs_permit: boolean
          notes: string | null
          order_id: string
          parking_distance_m: number
        }
        Insert: {
          address: string
          address_id: string
          floor?: number
          id?: string
          inventory_id: string
          lat?: number | null
          lift?: Database["public"]["Enums"]["lift_size"]
          lng?: number | null
          narrow_stairs?: boolean
          needs_permit?: boolean
          notes?: string | null
          order_id: string
          parking_distance_m?: number
        }
        Update: {
          address?: string
          address_id?: string
          floor?: number
          id?: string
          inventory_id?: string
          lat?: number | null
          lift?: Database["public"]["Enums"]["lift_size"]
          lng?: number | null
          narrow_stairs?: boolean
          needs_permit?: boolean
          notes?: string | null
          order_id?: string
          parking_distance_m?: number
        }
        Relationships: [
          {
            foreignKeyName: "inventory_addresses_address_id_order_id_fkey"
            columns: ["address_id", "order_id"]
            isOneToOne: false
            referencedRelation: "addresses"
            referencedColumns: ["id", "order_id"]
          },
          {
            foreignKeyName: "inventory_addresses_inventory_id_order_id_fkey"
            columns: ["inventory_id", "order_id"]
            isOneToOne: false
            referencedRelation: "inventories"
            referencedColumns: ["id", "order_id"]
          },
        ]
      }
      invitations: {
        Row: {
          accepted_at: string | null
          company_id: string
          created_at: string
          email: string
          expires_at: string
          id: string
          name: string
          phone: string | null
          revoked_at: string | null
          role: Database["public"]["Enums"]["company_role"]
          sent_at: string | null
          token_hash: string | null
          updated_at: string
        }
        Insert: {
          accepted_at?: string | null
          company_id: string
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          name: string
          phone?: string | null
          revoked_at?: string | null
          role: Database["public"]["Enums"]["company_role"]
          sent_at?: string | null
          token_hash?: string | null
          updated_at?: string
        }
        Update: {
          accepted_at?: string | null
          company_id?: string
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          name?: string
          phone?: string | null
          revoked_at?: string | null
          role?: Database["public"]["Enums"]["company_role"]
          sent_at?: string | null
          token_hash?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invitations_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          cancellation_reason: string | null
          cancelled_at: string | null
          cancelled_by_id: string | null
          cancelled_by_type: string | null
          contact_name: string
          contact_phone: string
          contact_source: string | null
          created_at: string
          created_by_company_id: string
          date_flexibility: Database["public"]["Enums"]["date_flexibility"]
          desired_date: string
          id: string
          link_validity_days: number | null
          token_expires_at: string | null
          token_hash: string | null
        }
        Insert: {
          cancellation_reason?: string | null
          cancelled_at?: string | null
          cancelled_by_id?: string | null
          cancelled_by_type?: string | null
          contact_name: string
          contact_phone: string
          contact_source?: string | null
          created_at?: string
          created_by_company_id: string
          date_flexibility?: Database["public"]["Enums"]["date_flexibility"]
          desired_date: string
          id?: string
          link_validity_days?: number | null
          token_expires_at?: string | null
          token_hash?: string | null
        }
        Update: {
          cancellation_reason?: string | null
          cancelled_at?: string | null
          cancelled_by_id?: string | null
          cancelled_by_type?: string | null
          contact_name?: string
          contact_phone?: string
          contact_source?: string | null
          created_at?: string
          created_by_company_id?: string
          date_flexibility?: Database["public"]["Enums"]["date_flexibility"]
          desired_date?: string
          id?: string
          link_validity_days?: number | null
          token_expires_at?: string | null
          token_hash?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_cancelled_by_id_fkey"
            columns: ["cancelled_by_id"]
            isOneToOne: false
            referencedRelation: "company_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_created_by_company_id_fkey"
            columns: ["created_by_company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_users: {
        Row: {
          active: boolean
          created_at: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id: string
          name: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      shipment_counters: {
        Row: {
          company_id: string
          last_number: number
        }
        Insert: {
          company_id: string
          last_number: number
        }
        Update: {
          company_id?: string
          last_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "shipment_counters_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: true
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      shipment_events: {
        Row: {
          actor_id: string | null
          actor_type: string
          company_id: string
          data: Json
          id: number
          kind: Database["public"]["Enums"]["shipment_event_kind"]
          occurred_at: string
          shipment_id: string
        }
        Insert: {
          actor_id?: string | null
          actor_type: string
          company_id: string
          data?: Json
          id?: never
          kind: Database["public"]["Enums"]["shipment_event_kind"]
          occurred_at?: string
          shipment_id: string
        }
        Update: {
          actor_id?: string | null
          actor_type?: string
          company_id?: string
          data?: Json
          id?: never
          kind?: Database["public"]["Enums"]["shipment_event_kind"]
          occurred_at?: string
          shipment_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shipment_events_shipment_id_company_id_fkey"
            columns: ["shipment_id", "company_id"]
            isOneToOne: false
            referencedRelation: "shipments"
            referencedColumns: ["id", "company_id"]
          },
        ]
      }
      shipment_notes: {
        Row: {
          author_id: string | null
          body: string
          company_id: string
          created_at: string
          id: string
          shipment_id: string
          updated_at: string
        }
        Insert: {
          author_id?: string | null
          body: string
          company_id: string
          created_at?: string
          id?: string
          shipment_id: string
          updated_at?: string
        }
        Update: {
          author_id?: string | null
          body?: string
          company_id?: string
          created_at?: string
          id?: string
          shipment_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "shipment_notes_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "company_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shipment_notes_shipment_id_company_id_fkey"
            columns: ["shipment_id", "company_id"]
            isOneToOne: false
            referencedRelation: "shipments"
            referencedColumns: ["id", "company_id"]
          },
        ]
      }
      shipments: {
        Row: {
          client_id: string
          company_id: string
          created_at: string
          id: string
          last_activity_at: string
          lost_reason: string | null
          number: number
          order_id: string
          status: Database["public"]["Enums"]["shipment_status"]
          status_changed_at: string
        }
        Insert: {
          client_id: string
          company_id: string
          created_at?: string
          id?: string
          last_activity_at?: string
          lost_reason?: string | null
          number: number
          order_id: string
          status?: Database["public"]["Enums"]["shipment_status"]
          status_changed_at?: string
        }
        Update: {
          client_id?: string
          company_id?: string
          created_at?: string
          id?: string
          last_activity_at?: string
          lost_reason?: string | null
          number?: number
          order_id?: string
          status?: Database["public"]["Enums"]["shipment_status"]
          status_changed_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "shipments_client_id_company_id_fkey"
            columns: ["client_id", "company_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id", "company_id"]
          },
          {
            foreignKeyName: "shipments_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shipments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicle_costs: {
        Row: {
          company_id: string
          cost_per_km_cents: number
          updated_at: string
          vehicle_id: string
        }
        Insert: {
          company_id: string
          cost_per_km_cents: number
          updated_at?: string
          vehicle_id: string
        }
        Update: {
          company_id?: string
          cost_per_km_cents?: number
          updated_at?: string
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vehicle_costs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicle_costs_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: true
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicles: {
        Row: {
          active: boolean
          capacity_m3: number
          company_id: string
          created_at: string
          id: string
          inactive_by: string | null
          inactive_reason:
            | Database["public"]["Enums"]["vehicle_inactive_reason"]
            | null
          inactive_since: string | null
          max_load_kg: number | null
          name: string | null
          plate: string
          type: Database["public"]["Enums"]["vehicle_type"]
          updated_at: string
        }
        Insert: {
          active?: boolean
          capacity_m3: number
          company_id: string
          created_at?: string
          id?: string
          inactive_by?: string | null
          inactive_reason?:
            | Database["public"]["Enums"]["vehicle_inactive_reason"]
            | null
          inactive_since?: string | null
          max_load_kg?: number | null
          name?: string | null
          plate: string
          type: Database["public"]["Enums"]["vehicle_type"]
          updated_at?: string
        }
        Update: {
          active?: boolean
          capacity_m3?: number
          company_id?: string
          created_at?: string
          id?: string
          inactive_by?: string | null
          inactive_reason?:
            | Database["public"]["Enums"]["vehicle_inactive_reason"]
            | null
          inactive_since?: string | null
          max_load_kg?: number | null
          name?: string | null
          plate?: string
          type?: Database["public"]["Enums"]["vehicle_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "vehicles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicles_inactive_by_fkey"
            columns: ["inactive_by"]
            isOneToOne: false
            referencedRelation: "company_users"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      accept_invitation: { Args: never; Returns: string }
      can_read_order: { Args: { p_order_id: string }; Returns: boolean }
      cancel_order: {
        Args: { p_order_id: string; p_reason: string }
        Returns: undefined
      }
      create_company_with_invitation: {
        Args: { p_actor_id: string; p_admin: Json; p_company: Json }
        Returns: Json
      }
      create_order: {
        Args: {
          p_client_email: string
          p_client_id: string
          p_client_name: string
          p_client_phone: string
          p_client_tax_id: string
          p_client_type: Database["public"]["Enums"]["client_type"]
          p_contact_source: string
          p_date_flexibility: Database["public"]["Enums"]["date_flexibility"]
          p_desired_date: string
          p_destination: string
          p_filled_by: Database["public"]["Enums"]["filled_by"]
          p_link_validity_days: number
          p_origin: string
          p_stops: string[]
        }
        Returns: number
      }
      create_vehicle: {
        Args: {
          p_active: boolean
          p_capacity_m3: number
          p_cost_per_km_cents: number
          p_max_load_kg: number
          p_name: string
          p_plate: string
          p_type: Database["public"]["Enums"]["vehicle_type"]
        }
        Returns: string
      }
      current_company_id: { Args: never; Returns: string }
      f_unaccent: { Args: { "": string }; Returns: string }
      is_company_administrator: { Args: never; Returns: boolean }
      is_platform_user: { Args: never; Returns: boolean }
      is_valid_tax_id: { Args: { tax_id: string }; Returns: boolean }
      search_catalog_items: {
        Args: { lang?: Database["public"]["Enums"]["app_locale"]; q: string }
        Returns: {
          category_id: string
          handling_flags: Database["public"]["Enums"]["handling_flag"][]
          item_id: string
          name: string
          volume_m3: number
        }[]
      }
    }
    Enums: {
      address_role: "origin" | "destination" | "stop"
      app_locale: "pt" | "es" | "en"
      client_type: "private" | "company"
      company_role: "administrator" | "operator"
      date_flexibility: "exact" | "two_days" | "one_week" | "month"
      filled_by: "client" | "company"
      handling_flag: "fragile" | "disassembly" | "extra_crew"
      lift_size: "none" | "small" | "large"
      shipment_event_kind:
        | "created"
        | "link_shared"
        | "link_resent"
        | "inventory_submitted"
        | "quote_sent"
        | "won"
        | "lost"
        | "cancelled"
        | "note_added"
      shipment_status:
        | "new"
        | "awaiting_inventory"
        | "inventory_received"
        | "quoted"
        | "won"
        | "lost"
        | "cancelled"
      vehicle_inactive_reason: "workshop" | "other"
      vehicle_type:
        | "small-van"
        | "van"
        | "medium-truck"
        | "large-truck"
        | "other"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      address_role: ["origin", "destination", "stop"],
      app_locale: ["pt", "es", "en"],
      client_type: ["private", "company"],
      company_role: ["administrator", "operator"],
      date_flexibility: ["exact", "two_days", "one_week", "month"],
      filled_by: ["client", "company"],
      handling_flag: ["fragile", "disassembly", "extra_crew"],
      lift_size: ["none", "small", "large"],
      shipment_event_kind: [
        "created",
        "link_shared",
        "link_resent",
        "inventory_submitted",
        "quote_sent",
        "won",
        "lost",
        "cancelled",
        "note_added",
      ],
      shipment_status: [
        "new",
        "awaiting_inventory",
        "inventory_received",
        "quoted",
        "won",
        "lost",
        "cancelled",
      ],
      vehicle_inactive_reason: ["workshop", "other"],
      vehicle_type: [
        "small-van",
        "van",
        "medium-truck",
        "large-truck",
        "other",
      ],
    },
  },
} as const
