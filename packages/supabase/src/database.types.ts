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
      acceptances: {
        Row: {
          accepted_at: string
          company_id: string
          document_hash: string
          id: string
          ip: unknown
          quote_id: string
          selected_line_ids: string[]
          signature_path: string
          signed_subtotal_cents: number
          signed_total_cents: number
          signed_vat_cents: number
          signer_name: string
        }
        Insert: {
          accepted_at?: string
          company_id: string
          document_hash: string
          id?: string
          ip?: unknown
          quote_id: string
          selected_line_ids?: string[]
          signature_path: string
          signed_subtotal_cents: number
          signed_total_cents: number
          signed_vat_cents: number
          signer_name: string
        }
        Update: {
          accepted_at?: string
          company_id?: string
          document_hash?: string
          id?: string
          ip?: unknown
          quote_id?: string
          selected_line_ids?: string[]
          signature_path?: string
          signed_subtotal_cents?: number
          signed_total_cents?: number
          signed_vat_cents?: number
          signer_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "acceptances_quote_id_company_id_fkey"
            columns: ["quote_id", "company_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id", "company_id"]
          },
        ]
      }
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
      catalog_extra_translations: {
        Row: {
          description: string | null
          extra_id: string
          locale: Database["public"]["Enums"]["app_locale"]
          name: string
        }
        Insert: {
          description?: string | null
          extra_id: string
          locale: Database["public"]["Enums"]["app_locale"]
          name: string
        }
        Update: {
          description?: string | null
          extra_id?: string
          locale?: Database["public"]["Enums"]["app_locale"]
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "catalog_extra_translations_extra_id_fkey"
            columns: ["extra_id"]
            isOneToOne: false
            referencedRelation: "catalog_extras"
            referencedColumns: ["id"]
          },
        ]
      }
      catalog_extras: {
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
      company_extras: {
        Row: {
          active: boolean
          catalog_extra_id: string | null
          company_id: string
          created_at: string
          id: string
          name: string
          price_cents: number
          price_mode: Database["public"]["Enums"]["price_mode"]
          updated_at: string
        }
        Insert: {
          active?: boolean
          catalog_extra_id?: string | null
          company_id: string
          created_at?: string
          id?: string
          name: string
          price_cents: number
          price_mode: Database["public"]["Enums"]["price_mode"]
          updated_at?: string
        }
        Update: {
          active?: boolean
          catalog_extra_id?: string | null
          company_id?: string
          created_at?: string
          id?: string
          name?: string
          price_cents?: number
          price_mode?: Database["public"]["Enums"]["price_mode"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_extras_catalog_extra_id_fkey"
            columns: ["catalog_extra_id"]
            isOneToOne: false
            referencedRelation: "catalog_extras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_extras_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
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
      inventory_extras: {
        Row: {
          catalog_extra_id: string
          created_at: string
          inventory_id: string
          note: string | null
          order_id: string
        }
        Insert: {
          catalog_extra_id: string
          created_at?: string
          inventory_id: string
          note?: string | null
          order_id: string
        }
        Update: {
          catalog_extra_id?: string
          created_at?: string
          inventory_id?: string
          note?: string | null
          order_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_extras_catalog_extra_id_fkey"
            columns: ["catalog_extra_id"]
            isOneToOne: false
            referencedRelation: "catalog_extras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_extras_inventory_id_order_id_fkey"
            columns: ["inventory_id", "order_id"]
            isOneToOne: false
            referencedRelation: "inventories"
            referencedColumns: ["id", "order_id"]
          },
        ]
      }
      inventory_line_adjustments: {
        Row: {
          company_id: string
          created_at: string
          inventory_line_id: string
          order_id: string
          unit_minutes: number | null
          unit_volume_m3: number | null
          unit_weight_kg: number | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          company_id: string
          created_at?: string
          inventory_line_id: string
          order_id: string
          unit_minutes?: number | null
          unit_volume_m3?: number | null
          unit_weight_kg?: number | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string
          inventory_line_id?: string
          order_id?: string
          unit_minutes?: number | null
          unit_volume_m3?: number | null
          unit_weight_kg?: number | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_line_adjustments_inventory_line_id_order_id_fkey"
            columns: ["inventory_line_id", "order_id"]
            isOneToOne: false
            referencedRelation: "inventory_lines"
            referencedColumns: ["id", "order_id"]
          },
          {
            foreignKeyName: "inventory_line_adjustments_order_id_company_id_fkey"
            columns: ["order_id", "company_id"]
            isOneToOne: false
            referencedRelation: "shipments"
            referencedColumns: ["order_id", "company_id"]
          },
          {
            foreignKeyName: "inventory_line_adjustments_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "company_users"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_lines: {
        Row: {
          base_changed: boolean
          catalog_item_id: string | null
          created_at: string
          description: string | null
          handling_flags: Database["public"]["Enums"]["handling_flag"][]
          id: string
          inventory_id: string
          needs_review: boolean | null
          order_id: string
          photos: string[]
          previous_line_id: string | null
          quantity: number
          room: string | null
          unit_minutes: number
          unit_volume_m3: number | null
          unit_weight_kg: number | null
          updated_at: string
        }
        Insert: {
          base_changed?: boolean
          catalog_item_id?: string | null
          created_at?: string
          description?: string | null
          handling_flags?: Database["public"]["Enums"]["handling_flag"][]
          id?: string
          inventory_id: string
          needs_review?: boolean | null
          order_id: string
          photos?: string[]
          previous_line_id?: string | null
          quantity?: number
          room?: string | null
          unit_minutes?: number
          unit_volume_m3?: number | null
          unit_weight_kg?: number | null
          updated_at?: string
        }
        Update: {
          base_changed?: boolean
          catalog_item_id?: string | null
          created_at?: string
          description?: string | null
          handling_flags?: Database["public"]["Enums"]["handling_flag"][]
          id?: string
          inventory_id?: string
          needs_review?: boolean | null
          order_id?: string
          photos?: string[]
          previous_line_id?: string | null
          quantity?: number
          room?: string | null
          unit_minutes?: number
          unit_volume_m3?: number | null
          unit_weight_kg?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_lines_catalog_item_id_fkey"
            columns: ["catalog_item_id"]
            isOneToOne: false
            referencedRelation: "catalog_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_lines_inventory_id_order_id_fkey"
            columns: ["inventory_id", "order_id"]
            isOneToOne: false
            referencedRelation: "inventories"
            referencedColumns: ["id", "order_id"]
          },
          {
            foreignKeyName: "inventory_lines_previous_line_id_order_id_fkey"
            columns: ["previous_line_id", "order_id"]
            isOneToOne: false
            referencedRelation: "inventory_lines"
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
      jobs: {
        Row: {
          company_id: string
          created_at: string
          id: string
          quote_id: string
          scheduled_start: string
          shipment_id: string
          status: Database["public"]["Enums"]["job_status"]
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          quote_id: string
          scheduled_start: string
          shipment_id: string
          status?: Database["public"]["Enums"]["job_status"]
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          quote_id?: string
          scheduled_start?: string
          shipment_id?: string
          status?: Database["public"]["Enums"]["job_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "jobs_quote_id_company_id_fkey"
            columns: ["quote_id", "company_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id", "company_id"]
          },
          {
            foreignKeyName: "jobs_shipment_id_company_id_fkey"
            columns: ["shipment_id", "company_id"]
            isOneToOne: false
            referencedRelation: "shipments"
            referencedColumns: ["id", "company_id"]
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
      quote_counters: {
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
            foreignKeyName: "quote_counters_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: true
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      quote_lines: {
        Row: {
          company_extra_id: string | null
          company_id: string
          description: string
          id: string
          kind: Database["public"]["Enums"]["quote_line_kind"]
          optional: boolean
          origin: Database["public"]["Enums"]["line_origin"]
          quantity: number
          quote_id: string
          sort_order: number
          total_cents: number
          unit: string | null
          unit_price_cents: number
        }
        Insert: {
          company_extra_id?: string | null
          company_id: string
          description: string
          id?: string
          kind: Database["public"]["Enums"]["quote_line_kind"]
          optional?: boolean
          origin?: Database["public"]["Enums"]["line_origin"]
          quantity: number
          quote_id: string
          sort_order?: number
          total_cents: number
          unit?: string | null
          unit_price_cents: number
        }
        Update: {
          company_extra_id?: string | null
          company_id?: string
          description?: string
          id?: string
          kind?: Database["public"]["Enums"]["quote_line_kind"]
          optional?: boolean
          origin?: Database["public"]["Enums"]["line_origin"]
          quantity?: number
          quote_id?: string
          sort_order?: number
          total_cents?: number
          unit?: string | null
          unit_price_cents?: number
        }
        Relationships: [
          {
            foreignKeyName: "quote_lines_company_extra_id_company_id_fkey"
            columns: ["company_extra_id", "company_id"]
            isOneToOne: false
            referencedRelation: "company_extras"
            referencedColumns: ["id", "company_id"]
          },
          {
            foreignKeyName: "quote_lines_quote_id_company_id_fkey"
            columns: ["quote_id", "company_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id", "company_id"]
          },
        ]
      }
      quotes: {
        Row: {
          calculation: Json
          company_id: string
          conditions: string | null
          created_at: string
          created_by: string | null
          document_hash: string | null
          estimated_cost_cents: number | null
          estimated_hours: number | null
          hourly_rate_cents: number | null
          id: string
          inventory_id: string
          km: number | null
          number: number
          operator_count: number | null
          pricing_mode: Database["public"]["Enums"]["quote_presentation"]
          rejected_at: string | null
          rejected_reason: string | null
          sent_at: string | null
          shipment_id: string
          snapshot: Json | null
          status: Database["public"]["Enums"]["quote_status"]
          suggested_price_cents: number | null
          supersedes_id: string | null
          tariff_id: string
          updated_at: string
          valid_until: string | null
          vat_pct: number
          vehicle_count: number | null
          version: number
          volume_m3: number | null
        }
        Insert: {
          calculation?: Json
          company_id: string
          conditions?: string | null
          created_at?: string
          created_by?: string | null
          document_hash?: string | null
          estimated_cost_cents?: number | null
          estimated_hours?: number | null
          hourly_rate_cents?: number | null
          id?: string
          inventory_id: string
          km?: number | null
          number: number
          operator_count?: number | null
          pricing_mode: Database["public"]["Enums"]["quote_presentation"]
          rejected_at?: string | null
          rejected_reason?: string | null
          sent_at?: string | null
          shipment_id: string
          snapshot?: Json | null
          status?: Database["public"]["Enums"]["quote_status"]
          suggested_price_cents?: number | null
          supersedes_id?: string | null
          tariff_id: string
          updated_at?: string
          valid_until?: string | null
          vat_pct: number
          vehicle_count?: number | null
          version: number
          volume_m3?: number | null
        }
        Update: {
          calculation?: Json
          company_id?: string
          conditions?: string | null
          created_at?: string
          created_by?: string | null
          document_hash?: string | null
          estimated_cost_cents?: number | null
          estimated_hours?: number | null
          hourly_rate_cents?: number | null
          id?: string
          inventory_id?: string
          km?: number | null
          number?: number
          operator_count?: number | null
          pricing_mode?: Database["public"]["Enums"]["quote_presentation"]
          rejected_at?: string | null
          rejected_reason?: string | null
          sent_at?: string | null
          shipment_id?: string
          snapshot?: Json | null
          status?: Database["public"]["Enums"]["quote_status"]
          suggested_price_cents?: number | null
          supersedes_id?: string | null
          tariff_id?: string
          updated_at?: string
          valid_until?: string | null
          vat_pct?: number
          vehicle_count?: number | null
          version?: number
          volume_m3?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "quotes_inventory_id_fkey"
            columns: ["inventory_id"]
            isOneToOne: false
            referencedRelation: "inventories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotes_shipment_id_company_id_fkey"
            columns: ["shipment_id", "company_id"]
            isOneToOne: false
            referencedRelation: "shipments"
            referencedColumns: ["id", "company_id"]
          },
          {
            foreignKeyName: "quotes_supersedes_id_fkey"
            columns: ["supersedes_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotes_tariff_id_fkey"
            columns: ["tariff_id"]
            isOneToOne: false
            referencedRelation: "tariffs"
            referencedColumns: ["id"]
          },
        ]
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
      tariffs: {
        Row: {
          average_speed_kmh: number
          company_id: string
          created_by: string | null
          crew_large: number
          crew_medium: number
          crew_medium_max_m3: number
          crew_small: number
          crew_small_max_m3: number
          id: string
          km_price_cents: number
          minimum_service_cents: number
          no_lift_floor_extra_pct: number
          no_lift_floor_surcharge_cents: number
          operator_hour_cost_cents: number
          operator_hour_price_cents: number
          parking_extra_pct_per_25m: number
          parking_surcharge_cents: number
          quote_presentation: Database["public"]["Enums"]["quote_presentation"]
          quote_validity_days: number
          stowage_factor: number
          valid_from: string
          vat_pct: number
          version: number
        }
        Insert: {
          average_speed_kmh?: number
          company_id: string
          created_by?: string | null
          crew_large?: number
          crew_medium?: number
          crew_medium_max_m3?: number
          crew_small?: number
          crew_small_max_m3?: number
          id?: string
          km_price_cents: number
          minimum_service_cents?: number
          no_lift_floor_extra_pct?: number
          no_lift_floor_surcharge_cents?: number
          operator_hour_cost_cents: number
          operator_hour_price_cents: number
          parking_extra_pct_per_25m?: number
          parking_surcharge_cents?: number
          quote_presentation?: Database["public"]["Enums"]["quote_presentation"]
          quote_validity_days?: number
          stowage_factor?: number
          valid_from?: string
          vat_pct?: number
          version: number
        }
        Update: {
          average_speed_kmh?: number
          company_id?: string
          created_by?: string | null
          crew_large?: number
          crew_medium?: number
          crew_medium_max_m3?: number
          crew_small?: number
          crew_small_max_m3?: number
          id?: string
          km_price_cents?: number
          minimum_service_cents?: number
          no_lift_floor_extra_pct?: number
          no_lift_floor_surcharge_cents?: number
          operator_hour_cost_cents?: number
          operator_hour_price_cents?: number
          parking_extra_pct_per_25m?: number
          parking_surcharge_cents?: number
          quote_presentation?: Database["public"]["Enums"]["quote_presentation"]
          quote_validity_days?: number
          stowage_factor?: number
          valid_from?: string
          vat_pct?: number
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "tariffs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
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
      client_accept_quote: {
        Args: {
          p_document_hash: string
          p_ip: unknown
          p_quote_id: string
          p_selected_line_ids: string[]
          p_signature_path: string
          p_signer_name: string
          p_token_hash: string
        }
        Returns: string
      }
      client_reject_quote: {
        Args: { p_quote_id: string; p_reason: string; p_token_hash: string }
        Returns: undefined
      }
      client_save_inventory_draft: {
        Args: {
          p_addresses: Json
          p_extras: Json
          p_lines: Json
          p_token_hash: string
        }
        Returns: undefined
      }
      client_submit_inventory: {
        Args: { p_token_hash: string }
        Returns: number
      }
      close_inventory_draft: {
        Args: {
          p_actor_id: string
          p_actor_name: string
          p_actor_type: string
          p_order_id: string
        }
        Returns: number
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
      delete_inventory_line: { Args: { p_line_id: string }; Returns: undefined }
      f_unaccent: { Args: { "": string }; Returns: string }
      insert_default_tariff: {
        Args: { p_company_id: string }
        Returns: undefined
      }
      is_company_administrator: { Args: never; Returns: boolean }
      is_platform_user: { Args: never; Returns: boolean }
      is_valid_tax_id: { Args: { tax_id: string }; Returns: boolean }
      lock_order_by_link: {
        Args: { p_token_hash: string; p_write: boolean }
        Returns: string
      }
      lock_owned_order: { Args: { p_order_id: string }; Returns: undefined }
      open_inventory_draft: { Args: { p_order_id: string }; Returns: string }
      quote_totals: {
        Args: { p_quote_id: string; p_selected: string[] }
        Returns: {
          subtotal_cents: number
          total_cents: number
          vat_cents: number
        }[]
      }
      save_company_extra: {
        Args: {
          p_active: boolean
          p_catalog_extra_id: string
          p_id: string
          p_name: string
          p_price_cents: number
          p_price_mode: Database["public"]["Enums"]["price_mode"]
        }
        Returns: string
      }
      save_inventory_address: {
        Args: {
          p_address: string
          p_floor: number
          p_inventory_address_id: string
          p_lat: number
          p_lift: Database["public"]["Enums"]["lift_size"]
          p_lng: number
          p_narrow_stairs: boolean
          p_needs_permit: boolean
          p_notes: string
          p_parking_distance_m: number
        }
        Returns: undefined
      }
      save_inventory_draft: {
        Args: {
          p_addresses: Json
          p_extras: Json
          p_lines: Json
          p_order_id: string
        }
        Returns: undefined
      }
      save_inventory_line: {
        Args: {
          p_catalog_item_id: string
          p_description: string
          p_handling_flags: Database["public"]["Enums"]["handling_flag"][]
          p_line_id: string
          p_order_id: string
          p_quantity: number
          p_room: string
          p_unit_minutes: number
          p_unit_volume_m3: number
          p_unit_weight_kg: number
        }
        Returns: string
      }
      save_quote_draft: {
        Args: { p_lines: Json; p_order_id: string; p_quote: Json }
        Returns: string
      }
      save_tariff: { Args: { p_tariff: Json }; Returns: number }
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
      send_quote: { Args: { p_quote_id: string }; Returns: number }
      set_inventory_extra: {
        Args: {
          p_catalog_extra_id: string
          p_note: string
          p_order_id: string
          p_selected: boolean
        }
        Returns: undefined
      }
      set_line_adjustment: {
        Args: {
          p_line_id: string
          p_unit_minutes: number
          p_unit_volume_m3: number
          p_unit_weight_kg: number
        }
        Returns: undefined
      }
      share_order_link: { Args: { p_order_id: string }; Returns: string }
      submit_inventory: { Args: { p_order_id: string }; Returns: number }
      write_inventory_draft: {
        Args: {
          p_addresses: Json
          p_extras: Json
          p_lines: Json
          p_order_id: string
        }
        Returns: undefined
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
      job_status:
        | "scheduled"
        | "in_progress"
        | "delivered"
        | "closed"
        | "cancelled"
      lift_size: "none" | "small" | "large"
      line_origin: "calculated" | "manual"
      price_mode: "fixed" | "unit" | "hour" | "m3" | "m3_month"
      quote_line_kind: "base" | "extra" | "manual"
      quote_presentation: "fixed" | "hourly"
      quote_status: "draft" | "sent" | "accepted" | "rejected" | "superseded"
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
      job_status: [
        "scheduled",
        "in_progress",
        "delivered",
        "closed",
        "cancelled",
      ],
      lift_size: ["none", "small", "large"],
      line_origin: ["calculated", "manual"],
      price_mode: ["fixed", "unit", "hour", "m3", "m3_month"],
      quote_line_kind: ["base", "extra", "manual"],
      quote_presentation: ["fixed", "hourly"],
      quote_status: ["draft", "sent", "accepted", "rejected", "superseded"],
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
