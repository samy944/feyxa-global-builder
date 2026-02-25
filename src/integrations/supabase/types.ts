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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      admin_invitations: {
        Row: {
          accepted_by: string | null
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by: string
          status: string
          token_hash: string
        }
        Insert: {
          accepted_by?: string | null
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          invited_by: string
          status?: string
          token_hash: string
        }
        Update: {
          accepted_by?: string | null
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string
          status?: string
          token_hash?: string
        }
        Relationships: []
      }
      analytics_events: {
        Row: {
          created_at: string
          currency: string
          event_type: string
          event_value: number
          id: string
          metadata: Json | null
          product_id: string | null
          session_id: string | null
          store_id: string
        }
        Insert: {
          created_at?: string
          currency?: string
          event_type: string
          event_value?: number
          id?: string
          metadata?: Json | null
          product_id?: string | null
          session_id?: string | null
          store_id: string
        }
        Update: {
          created_at?: string
          currency?: string
          event_type?: string
          event_value?: number
          id?: string
          metadata?: Json | null
          product_id?: string | null
          session_id?: string | null
          store_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "analytics_events_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "analytics_events_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string
          id: string
          metadata: Json | null
          store_id: string
          target_id: string | null
          target_type: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          metadata?: Json | null
          store_id: string
          target_id?: string | null
          target_type?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          store_id?: string
          target_id?: string | null
          target_type?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      cities: {
        Row: {
          country_id: string
          created_at: string
          id: string
          is_active: boolean
          name: string
          sort_order: number | null
        }
        Insert: {
          country_id: string
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          sort_order?: number | null
        }
        Update: {
          country_id?: string
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "cities_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
        ]
      }
      collection_products: {
        Row: {
          collection_id: string
          product_id: string
          sort_order: number | null
        }
        Insert: {
          collection_id: string
          product_id: string
          sort_order?: number | null
        }
        Update: {
          collection_id?: string
          product_id?: string
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "collection_products_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "collections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collection_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      collections: {
        Row: {
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          is_smart: boolean | null
          name: string
          rules: Json | null
          slug: string
          sort_order: number | null
          store_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_smart?: boolean | null
          name: string
          rules?: Json | null
          slug: string
          sort_order?: number | null
          store_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_smart?: boolean | null
          name?: string
          rules?: Json | null
          slug?: string
          sort_order?: number | null
          store_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "collections_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      countries: {
        Row: {
          code: string
          created_at: string
          currency_code: string
          flag_emoji: string | null
          id: string
          is_active: boolean
          name: string
          sort_order: number | null
        }
        Insert: {
          code: string
          created_at?: string
          currency_code?: string
          flag_emoji?: string | null
          id?: string
          is_active?: boolean
          name: string
          sort_order?: number | null
        }
        Update: {
          code?: string
          created_at?: string
          currency_code?: string
          flag_emoji?: string | null
          id?: string
          is_active?: boolean
          name?: string
          sort_order?: number | null
        }
        Relationships: []
      }
      coupons: {
        Row: {
          code: string
          created_at: string
          discount_type: Database["public"]["Enums"]["discount_type"]
          discount_value: number
          expires_at: string | null
          id: string
          is_active: boolean
          max_uses: number | null
          min_order_amount: number | null
          store_id: string
          used_count: number
        }
        Insert: {
          code: string
          created_at?: string
          discount_type?: Database["public"]["Enums"]["discount_type"]
          discount_value?: number
          expires_at?: string | null
          id?: string
          is_active?: boolean
          max_uses?: number | null
          min_order_amount?: number | null
          store_id: string
          used_count?: number
        }
        Update: {
          code?: string
          created_at?: string
          discount_type?: Database["public"]["Enums"]["discount_type"]
          discount_value?: number
          expires_at?: string | null
          id?: string
          is_active?: boolean
          max_uses?: number | null
          min_order_amount?: number | null
          store_id?: string
          used_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "coupons_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          address: string | null
          city: string | null
          created_at: string
          email: string | null
          first_name: string
          id: string
          last_name: string | null
          notes: string | null
          phone: string
          quarter: string | null
          store_id: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          created_at?: string
          email?: string | null
          first_name: string
          id?: string
          last_name?: string | null
          notes?: string | null
          phone: string
          quarter?: string | null
          store_id: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          created_at?: string
          email?: string | null
          first_name?: string
          id?: string
          last_name?: string | null
          notes?: string | null
          phone?: string
          quarter?: string | null
          store_id?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customers_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      delivery_confirmations: {
        Row: {
          confirmed_by: string | null
          created_at: string
          expires_at: string
          id: string
          method: string
          order_id: string
          otp_code: string | null
          store_id: string
          token_hash: string
          used_at: string | null
        }
        Insert: {
          confirmed_by?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          method?: string
          order_id: string
          otp_code?: string | null
          store_id: string
          token_hash: string
          used_at?: string | null
        }
        Update: {
          confirmed_by?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          method?: string
          order_id?: string
          otp_code?: string | null
          store_id?: string
          token_hash?: string
          used_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "delivery_confirmations_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "delivery_confirmations_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      delivery_proof_files: {
        Row: {
          created_at: string
          file_url: string
          id: string
          mime_type: string
          proof_id: string
          size: number
        }
        Insert: {
          created_at?: string
          file_url: string
          id?: string
          mime_type?: string
          proof_id: string
          size?: number
        }
        Update: {
          created_at?: string
          file_url?: string
          id?: string
          mime_type?: string
          proof_id?: string
          size?: number
        }
        Relationships: [
          {
            foreignKeyName: "delivery_proof_files_proof_id_fkey"
            columns: ["proof_id"]
            isOneToOne: false
            referencedRelation: "delivery_proofs"
            referencedColumns: ["id"]
          },
        ]
      }
      delivery_proofs: {
        Row: {
          courier_id: string | null
          created_at: string
          id: string
          notes: string | null
          order_id: string
          seller_id: string
          store_id: string
        }
        Insert: {
          courier_id?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          order_id: string
          seller_id: string
          store_id: string
        }
        Update: {
          courier_id?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          order_id?: string
          seller_id?: string
          store_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "delivery_proofs_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "delivery_proofs_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      delivery_zones: {
        Row: {
          cities: string[] | null
          created_at: string
          fee: number
          id: string
          is_active: boolean
          name: string
          quarters: string[] | null
          store_id: string
        }
        Insert: {
          cities?: string[] | null
          created_at?: string
          fee?: number
          id?: string
          is_active?: boolean
          name: string
          quarters?: string[] | null
          store_id: string
        }
        Update: {
          cities?: string[] | null
          created_at?: string
          fee?: number
          id?: string
          is_active?: boolean
          name?: string
          quarters?: string[] | null
          store_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "delivery_zones_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      email_logs: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          metadata: Json | null
          provider_id: string | null
          provider_message_id: string | null
          recipient: string
          status: string
          subject: string
          template_slug: string | null
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          metadata?: Json | null
          provider_id?: string | null
          provider_message_id?: string | null
          recipient: string
          status?: string
          subject: string
          template_slug?: string | null
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          metadata?: Json | null
          provider_id?: string | null
          provider_message_id?: string | null
          recipient?: string
          status?: string
          subject?: string
          template_slug?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_logs_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "email_providers"
            referencedColumns: ["id"]
          },
        ]
      }
      email_providers: {
        Row: {
          config: Json
          created_at: string
          from_email: string
          from_name: string
          id: string
          is_active: boolean
          is_default: boolean
          name: string
          provider_type: string
          updated_at: string
        }
        Insert: {
          config?: Json
          created_at?: string
          from_email?: string
          from_name?: string
          id?: string
          is_active?: boolean
          is_default?: boolean
          name: string
          provider_type?: string
          updated_at?: string
        }
        Update: {
          config?: Json
          created_at?: string
          from_email?: string
          from_name?: string
          id?: string
          is_active?: boolean
          is_default?: boolean
          name?: string
          provider_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      email_templates: {
        Row: {
          category: string
          created_at: string
          html_body: string
          id: string
          is_active: boolean
          name: string
          slug: string
          subject: string
          updated_at: string
          variables: Json | null
        }
        Insert: {
          category?: string
          created_at?: string
          html_body: string
          id?: string
          is_active?: boolean
          name: string
          slug: string
          subject: string
          updated_at?: string
          variables?: Json | null
        }
        Update: {
          category?: string
          created_at?: string
          html_body?: string
          id?: string
          is_active?: boolean
          name?: string
          slug?: string
          subject?: string
          updated_at?: string
          variables?: Json | null
        }
        Relationships: []
      }
      escrow_records: {
        Row: {
          amount: number
          commission_amount: number
          commission_rate: number
          created_at: string
          id: string
          order_id: string
          release_at: string
          released_at: string | null
          status: Database["public"]["Enums"]["escrow_status"]
          store_id: string
        }
        Insert: {
          amount: number
          commission_amount?: number
          commission_rate?: number
          created_at?: string
          id?: string
          order_id: string
          release_at?: string
          released_at?: string | null
          status?: Database["public"]["Enums"]["escrow_status"]
          store_id: string
        }
        Update: {
          amount?: number
          commission_amount?: number
          commission_rate?: number
          created_at?: string
          id?: string
          order_id?: string
          release_at?: string
          released_at?: string | null
          status?: Database["public"]["Enums"]["escrow_status"]
          store_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "escrow_records_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "escrow_records_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      event_handlers_log: {
        Row: {
          created_at: string
          duration_ms: number | null
          error_message: string | null
          event_id: string
          handler_name: string
          id: string
          status: string
        }
        Insert: {
          created_at?: string
          duration_ms?: number | null
          error_message?: string | null
          event_id: string
          handler_name: string
          id?: string
          status?: string
        }
        Update: {
          created_at?: string
          duration_ms?: number | null
          error_message?: string | null
          event_id?: string
          handler_name?: string
          id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_handlers_log_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events_log"
            referencedColumns: ["id"]
          },
        ]
      }
      events_log: {
        Row: {
          aggregate_id: string
          aggregate_type: string
          created_at: string
          error_message: string | null
          event_type: string
          id: string
          idempotency_key: string
          max_retries: number
          next_retry_at: string
          payload: Json
          processed_at: string | null
          retry_count: number
          status: string
          store_id: string | null
        }
        Insert: {
          aggregate_id: string
          aggregate_type: string
          created_at?: string
          error_message?: string | null
          event_type: string
          id?: string
          idempotency_key: string
          max_retries?: number
          next_retry_at?: string
          payload?: Json
          processed_at?: string | null
          retry_count?: number
          status?: string
          store_id?: string | null
        }
        Update: {
          aggregate_id?: string
          aggregate_type?: string
          created_at?: string
          error_message?: string | null
          event_type?: string
          id?: string
          idempotency_key?: string
          max_retries?: number
          next_retry_at?: string
          payload?: Json
          processed_at?: string | null
          retry_count?: number
          status?: string
          store_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "events_log_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      feature_flags: {
        Row: {
          category: string
          created_at: string
          description: string | null
          id: string
          is_enabled: boolean
          key: string
          name: string
          updated_at: string
        }
        Insert: {
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          is_enabled?: boolean
          key: string
          name: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          is_enabled?: boolean
          key?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      financing_offers: {
        Row: {
          accepted_at: string | null
          amount_repaid: number
          closed_at: string | null
          created_at: string
          defaulted_at: string | null
          id: string
          missed_cycles: number
          offered_amount: number
          remaining_balance: number
          repayment_percentage: number
          status: Database["public"]["Enums"]["financing_offer_status"]
          store_id: string
          total_repayable: number
          updated_at: string
        }
        Insert: {
          accepted_at?: string | null
          amount_repaid?: number
          closed_at?: string | null
          created_at?: string
          defaulted_at?: string | null
          id?: string
          missed_cycles?: number
          offered_amount: number
          remaining_balance: number
          repayment_percentage?: number
          status?: Database["public"]["Enums"]["financing_offer_status"]
          store_id: string
          total_repayable: number
          updated_at?: string
        }
        Update: {
          accepted_at?: string | null
          amount_repaid?: number
          closed_at?: string | null
          created_at?: string
          defaulted_at?: string | null
          id?: string
          missed_cycles?: number
          offered_amount?: number
          remaining_balance?: number
          repayment_percentage?: number
          status?: Database["public"]["Enums"]["financing_offer_status"]
          store_id?: string
          total_repayable?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "financing_offers_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      financing_repayments: {
        Row: {
          amount_deducted: number
          created_at: string
          id: string
          offer_id: string
          payout_amount: number
          payout_id: string | null
          remaining_after: number
          store_id: string
        }
        Insert: {
          amount_deducted: number
          created_at?: string
          id?: string
          offer_id: string
          payout_amount: number
          payout_id?: string | null
          remaining_after: number
          store_id: string
        }
        Update: {
          amount_deducted?: number
          created_at?: string
          id?: string
          offer_id?: string
          payout_amount?: number
          payout_id?: string | null
          remaining_after?: number
          store_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "financing_repayments_offer_id_fkey"
            columns: ["offer_id"]
            isOneToOne: false
            referencedRelation: "financing_offers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financing_repayments_payout_id_fkey"
            columns: ["payout_id"]
            isOneToOne: false
            referencedRelation: "payout_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financing_repayments_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      inbound_items: {
        Row: {
          created_at: string
          id: string
          product_id: string
          quantity: number
          received_quantity: number
          shipment_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          quantity?: number
          received_quantity?: number
          shipment_id: string
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          quantity?: number
          received_quantity?: number
          shipment_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inbound_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inbound_items_shipment_id_fkey"
            columns: ["shipment_id"]
            isOneToOne: false
            referencedRelation: "inbound_shipments"
            referencedColumns: ["id"]
          },
        ]
      }
      inbound_shipments: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          received_at: string | null
          shipped_at: string | null
          status: Database["public"]["Enums"]["shipment_status"]
          store_id: string
          tracking_number: string | null
          updated_at: string
          warehouse_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          received_at?: string | null
          shipped_at?: string | null
          status?: Database["public"]["Enums"]["shipment_status"]
          store_id: string
          tracking_number?: string | null
          updated_at?: string
          warehouse_id: string
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          received_at?: string | null
          shipped_at?: string | null
          status?: Database["public"]["Enums"]["shipment_status"]
          store_id?: string
          tracking_number?: string | null
          updated_at?: string
          warehouse_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inbound_shipments_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inbound_shipments_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_metrics: {
        Row: {
          avg_daily_sales: number
          country_id: string | null
          created_at: string
          days_until_stockout: number
          forecast_next_30d: number
          growth_rate: number
          high_demand: boolean
          id: string
          last_calculated_at: string
          product_id: string
          recommended_stock_level: number
          sales_30d: number
          sales_7d: number
          stock_status: string
        }
        Insert: {
          avg_daily_sales?: number
          country_id?: string | null
          created_at?: string
          days_until_stockout?: number
          forecast_next_30d?: number
          growth_rate?: number
          high_demand?: boolean
          id?: string
          last_calculated_at?: string
          product_id: string
          recommended_stock_level?: number
          sales_30d?: number
          sales_7d?: number
          stock_status?: string
        }
        Update: {
          avg_daily_sales?: number
          country_id?: string | null
          created_at?: string
          days_until_stockout?: number
          forecast_next_30d?: number
          growth_rate?: number
          high_demand?: boolean
          id?: string
          last_calculated_at?: string
          product_id?: string
          recommended_stock_level?: number
          sales_30d?: number
          sales_7d?: number
          stock_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_metrics_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_metrics_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      landing_ab_variants: {
        Row: {
          add_to_carts: number
          clicks: number
          created_at: string
          id: string
          is_winner: boolean
          landing_page_id: string
          purchases: number
          revenue: number
          sections: Json
          updated_at: string
          variant_name: string
          views: number
        }
        Insert: {
          add_to_carts?: number
          clicks?: number
          created_at?: string
          id?: string
          is_winner?: boolean
          landing_page_id: string
          purchases?: number
          revenue?: number
          sections?: Json
          updated_at?: string
          variant_name?: string
          views?: number
        }
        Update: {
          add_to_carts?: number
          clicks?: number
          created_at?: string
          id?: string
          is_winner?: boolean
          landing_page_id?: string
          purchases?: number
          revenue?: number
          sections?: Json
          updated_at?: string
          variant_name?: string
          views?: number
        }
        Relationships: [
          {
            foreignKeyName: "landing_ab_variants_landing_page_id_fkey"
            columns: ["landing_page_id"]
            isOneToOne: false
            referencedRelation: "landing_pages"
            referencedColumns: ["id"]
          },
        ]
      }
      landing_pages: {
        Row: {
          ab_enabled: boolean
          ab_split: number
          collection_id: string | null
          created_at: string
          id: string
          og_image_url: string | null
          product_id: string | null
          sections: Json
          seo_description: string | null
          seo_title: string | null
          slug: string
          status: Database["public"]["Enums"]["landing_status"]
          store_id: string
          template_id: string
          theme: Json | null
          title: string
          updated_at: string
        }
        Insert: {
          ab_enabled?: boolean
          ab_split?: number
          collection_id?: string | null
          created_at?: string
          id?: string
          og_image_url?: string | null
          product_id?: string | null
          sections?: Json
          seo_description?: string | null
          seo_title?: string | null
          slug: string
          status?: Database["public"]["Enums"]["landing_status"]
          store_id: string
          template_id?: string
          theme?: Json | null
          title: string
          updated_at?: string
        }
        Update: {
          ab_enabled?: boolean
          ab_split?: number
          collection_id?: string | null
          created_at?: string
          id?: string
          og_image_url?: string | null
          product_id?: string | null
          sections?: Json
          seo_description?: string | null
          seo_title?: string | null
          slug?: string
          status?: Database["public"]["Enums"]["landing_status"]
          store_id?: string
          template_id?: string
          theme?: Json | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "landing_pages_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "collections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "landing_pages_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "landing_pages_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      landing_revisions: {
        Row: {
          author_id: string | null
          created_at: string
          id: string
          label: string | null
          landing_page_id: string
          sections: Json
          theme: Json | null
          variant_id: string | null
        }
        Insert: {
          author_id?: string | null
          created_at?: string
          id?: string
          label?: string | null
          landing_page_id: string
          sections?: Json
          theme?: Json | null
          variant_id?: string | null
        }
        Update: {
          author_id?: string | null
          created_at?: string
          id?: string
          label?: string | null
          landing_page_id?: string
          sections?: Json
          theme?: Json | null
          variant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "landing_revisions_landing_page_id_fkey"
            columns: ["landing_page_id"]
            isOneToOne: false
            referencedRelation: "landing_pages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "landing_revisions_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "landing_ab_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      landing_subpages: {
        Row: {
          created_at: string
          id: string
          is_home: boolean
          landing_page_id: string
          sections: Json
          slug: string
          sort_order: number
          title: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_home?: boolean
          landing_page_id: string
          sections?: Json
          slug: string
          sort_order?: number
          title: string
        }
        Update: {
          created_at?: string
          id?: string
          is_home?: boolean
          landing_page_id?: string
          sections?: Json
          slug?: string
          sort_order?: number
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "landing_subpages_landing_page_id_fkey"
            columns: ["landing_page_id"]
            isOneToOne: false
            referencedRelation: "landing_pages"
            referencedColumns: ["id"]
          },
        ]
      }
      login_activity: {
        Row: {
          city: string | null
          country: string | null
          created_at: string
          device_info: Json | null
          failure_reason: string | null
          id: string
          ip_address: string | null
          success: boolean
          user_agent: string | null
          user_id: string
        }
        Insert: {
          city?: string | null
          country?: string | null
          created_at?: string
          device_info?: Json | null
          failure_reason?: string | null
          id?: string
          ip_address?: string | null
          success?: boolean
          user_agent?: string | null
          user_id: string
        }
        Update: {
          city?: string | null
          country?: string | null
          created_at?: string
          device_info?: Json | null
          failure_reason?: string | null
          id?: string
          ip_address?: string | null
          success?: boolean
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      marketplace_categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          name: string
          parent_id: string | null
          slug: string
          sort_order: number | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          name: string
          parent_id?: string | null
          slug: string
          sort_order?: number | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          name?: string
          parent_id?: string | null
          slug?: string
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "marketplace_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_listings: {
        Row: {
          created_at: string
          id: string
          product_id: string
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["marketplace_listing_status"]
          store_id: string
          submitted_at: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["marketplace_listing_status"]
          store_id: string
          submitted_at?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["marketplace_listing_status"]
          store_id?: string
          submitted_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_listings_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: true
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_listings_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          is_read: boolean
          metadata: Json | null
          store_id: string
          title: string
          type: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          metadata?: Json | null
          store_id: string
          title: string
          type?: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          metadata?: Json | null
          store_id?: string
          title?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      order_attributions: {
        Row: {
          created_at: string
          first_campaign: string | null
          first_content: string | null
          first_medium: string | null
          first_source: string | null
          id: string
          last_campaign: string | null
          last_content: string | null
          last_medium: string | null
          last_source: string | null
          order_id: string
          session_id: string | null
          store_id: string
          tracking_link_id: string | null
        }
        Insert: {
          created_at?: string
          first_campaign?: string | null
          first_content?: string | null
          first_medium?: string | null
          first_source?: string | null
          id?: string
          last_campaign?: string | null
          last_content?: string | null
          last_medium?: string | null
          last_source?: string | null
          order_id: string
          session_id?: string | null
          store_id: string
          tracking_link_id?: string | null
        }
        Update: {
          created_at?: string
          first_campaign?: string | null
          first_content?: string | null
          first_medium?: string | null
          first_source?: string | null
          id?: string
          last_campaign?: string | null
          last_content?: string | null
          last_medium?: string | null
          last_source?: string | null
          order_id?: string
          session_id?: string | null
          store_id?: string
          tracking_link_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_attributions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: true
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_attributions_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_attributions_tracking_link_id_fkey"
            columns: ["tracking_link_id"]
            isOneToOne: false
            referencedRelation: "tracking_links"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          created_at: string
          id: string
          order_id: string
          product_id: string | null
          product_name: string
          quantity: number
          total: number
          unit_price: number
          variant_id: string | null
          variant_name: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          order_id: string
          product_id?: string | null
          product_name: string
          quantity?: number
          total?: number
          unit_price?: number
          variant_id?: string | null
          variant_name?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          order_id?: string
          product_id?: string | null
          product_name?: string
          quantity?: number
          total?: number
          unit_price?: number
          variant_id?: string | null
          variant_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      order_status_history: {
        Row: {
          changed_by: string | null
          created_at: string
          id: string
          new_status: string
          note: string | null
          order_id: string
          previous_status: string | null
          store_id: string
        }
        Insert: {
          changed_by?: string | null
          created_at?: string
          id?: string
          new_status: string
          note?: string | null
          order_id: string
          previous_status?: string | null
          store_id: string
        }
        Update: {
          changed_by?: string | null
          created_at?: string
          id?: string
          new_status?: string
          note?: string | null
          order_id?: string
          previous_status?: string | null
          store_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_status_history_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_status_history_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          coupon_code: string | null
          created_at: string
          currency: string
          customer_email: string | null
          customer_id: string | null
          discount_amount: number
          id: string
          notes: string | null
          order_number: string
          payment_method: string | null
          payment_status: Database["public"]["Enums"]["payment_status"]
          shipping_address: string | null
          shipping_city: string | null
          shipping_cost: number
          shipping_mode: string | null
          shipping_phone: string | null
          shipping_quarter: string | null
          status: Database["public"]["Enums"]["order_status"]
          store_id: string
          subtotal: number
          total: number
          tracking_token: string | null
          updated_at: string
        }
        Insert: {
          coupon_code?: string | null
          created_at?: string
          currency?: string
          customer_email?: string | null
          customer_id?: string | null
          discount_amount?: number
          id?: string
          notes?: string | null
          order_number: string
          payment_method?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"]
          shipping_address?: string | null
          shipping_city?: string | null
          shipping_cost?: number
          shipping_mode?: string | null
          shipping_phone?: string | null
          shipping_quarter?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          store_id: string
          subtotal?: number
          total?: number
          tracking_token?: string | null
          updated_at?: string
        }
        Update: {
          coupon_code?: string | null
          created_at?: string
          currency?: string
          customer_email?: string | null
          customer_id?: string | null
          discount_amount?: number
          id?: string
          notes?: string | null
          order_number?: string
          payment_method?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"]
          shipping_address?: string | null
          shipping_city?: string | null
          shipping_cost?: number
          shipping_mode?: string | null
          shipping_phone?: string | null
          shipping_quarter?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          store_id?: string
          subtotal?: number
          total?: number
          tracking_token?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      otp_codes: {
        Row: {
          attempts: number
          code_hash: string
          created_at: string
          expires_at: string
          id: string
          max_attempts: number
          purpose: string
          used_at: string | null
          user_id: string
        }
        Insert: {
          attempts?: number
          code_hash: string
          created_at?: string
          expires_at?: string
          id?: string
          max_attempts?: number
          purpose?: string
          used_at?: string | null
          user_id: string
        }
        Update: {
          attempts?: number
          code_hash?: string
          created_at?: string
          expires_at?: string
          id?: string
          max_attempts?: number
          purpose?: string
          used_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      outbound_shipments: {
        Row: {
          created_at: string
          delivered_at: string | null
          id: string
          order_id: string
          packed_at: string | null
          picked_at: string | null
          shipped_at: string | null
          sla_deadline: string | null
          status: Database["public"]["Enums"]["outbound_status"]
          store_id: string
          tracking_number: string | null
          updated_at: string
          warehouse_id: string
        }
        Insert: {
          created_at?: string
          delivered_at?: string | null
          id?: string
          order_id: string
          packed_at?: string | null
          picked_at?: string | null
          shipped_at?: string | null
          sla_deadline?: string | null
          status?: Database["public"]["Enums"]["outbound_status"]
          store_id: string
          tracking_number?: string | null
          updated_at?: string
          warehouse_id: string
        }
        Update: {
          created_at?: string
          delivered_at?: string | null
          id?: string
          order_id?: string
          packed_at?: string | null
          picked_at?: string | null
          shipped_at?: string | null
          sla_deadline?: string | null
          status?: Database["public"]["Enums"]["outbound_status"]
          store_id?: string
          tracking_number?: string | null
          updated_at?: string
          warehouse_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "outbound_shipments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "outbound_shipments_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "outbound_shipments_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      payout_requests: {
        Row: {
          amount: number
          created_at: string
          id: string
          notes: string | null
          payment_details: Json | null
          payment_method: string | null
          processed_at: string | null
          status: Database["public"]["Enums"]["payout_status"]
          store_id: string
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          notes?: string | null
          payment_details?: Json | null
          payment_method?: string | null
          processed_at?: string | null
          status?: Database["public"]["Enums"]["payout_status"]
          store_id: string
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          notes?: string | null
          payment_details?: Json | null
          payment_method?: string | null
          processed_at?: string | null
          status?: Database["public"]["Enums"]["payout_status"]
          store_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payout_requests_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_branding: {
        Row: {
          button_color: string
          button_text_color: string
          custom_css: string | null
          default_image_url: string | null
          favicon_url: string | null
          font_family: string
          font_heading: string
          footer_links: Json | null
          footer_text: string | null
          id: string
          logo_dark_url: string | null
          logo_url: string | null
          meta_description: string | null
          platform_name: string
          primary_color: string
          secondary_color: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          button_color?: string
          button_text_color?: string
          custom_css?: string | null
          default_image_url?: string | null
          favicon_url?: string | null
          font_family?: string
          font_heading?: string
          footer_links?: Json | null
          footer_text?: string | null
          id?: string
          logo_dark_url?: string | null
          logo_url?: string | null
          meta_description?: string | null
          platform_name?: string
          primary_color?: string
          secondary_color?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          button_color?: string
          button_text_color?: string
          custom_css?: string | null
          default_image_url?: string | null
          favicon_url?: string | null
          font_family?: string
          font_heading?: string
          footer_links?: Json | null
          footer_text?: string | null
          id?: string
          logo_dark_url?: string | null
          logo_url?: string | null
          meta_description?: string | null
          platform_name?: string
          primary_color?: string
          secondary_color?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      platform_payment_providers: {
        Row: {
          config: Json
          created_at: string
          display_name: string
          id: string
          is_enabled: boolean
          provider: string
          supported_countries: string[]
          updated_at: string
        }
        Insert: {
          config?: Json
          created_at?: string
          display_name: string
          id?: string
          is_enabled?: boolean
          provider: string
          supported_countries?: string[]
          updated_at?: string
        }
        Update: {
          config?: Json
          created_at?: string
          display_name?: string
          id?: string
          is_enabled?: boolean
          provider?: string
          supported_countries?: string[]
          updated_at?: string
        }
        Relationships: []
      }
      platform_plans: {
        Row: {
          billing_interval: string
          created_at: string
          currency: string
          description: string | null
          features: Json
          fedapay_plan_id: string | null
          id: string
          is_active: boolean
          is_default: boolean
          limits: Json
          name: string
          price: number
          slug: string
          sort_order: number
          stripe_price_id: string | null
          updated_at: string
        }
        Insert: {
          billing_interval?: string
          created_at?: string
          currency?: string
          description?: string | null
          features?: Json
          fedapay_plan_id?: string | null
          id?: string
          is_active?: boolean
          is_default?: boolean
          limits?: Json
          name: string
          price?: number
          slug: string
          sort_order?: number
          stripe_price_id?: string | null
          updated_at?: string
        }
        Update: {
          billing_interval?: string
          created_at?: string
          currency?: string
          description?: string | null
          features?: Json
          fedapay_plan_id?: string | null
          id?: string
          is_active?: boolean
          is_default?: boolean
          limits?: Json
          name?: string
          price?: number
          slug?: string
          sort_order?: number
          stripe_price_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      platform_settings: {
        Row: {
          key: string
          updated_at: string
          updated_by: string | null
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Update: {
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Relationships: []
      }
      product_listings: {
        Row: {
          country_id: string
          created_at: string
          currency_code: string
          fulfillment_type: Database["public"]["Enums"]["fulfillment_type"]
          id: string
          is_available: boolean
          price: number
          product_id: string
          shipping_profile_id: string | null
          stock_qty: number
          updated_at: string
        }
        Insert: {
          country_id: string
          created_at?: string
          currency_code?: string
          fulfillment_type?: Database["public"]["Enums"]["fulfillment_type"]
          id?: string
          is_available?: boolean
          price?: number
          product_id: string
          shipping_profile_id?: string | null
          stock_qty?: number
          updated_at?: string
        }
        Update: {
          country_id?: string
          created_at?: string
          currency_code?: string
          fulfillment_type?: Database["public"]["Enums"]["fulfillment_type"]
          id?: string
          is_available?: boolean
          price?: number
          product_id?: string
          shipping_profile_id?: string | null
          stock_qty?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_listings_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_listings_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_ranking_scores: {
        Row: {
          conversion_rate: number
          created_at: string
          id: string
          last_calculated_at: string
          previous_score: number
          product_id: string
          rating: number
          return_rate: number
          review_count: number
          risk_penalty: number
          sales_30d: number
          sales_weight: number
          score: number
          seller_sla: number
          trending_badge: boolean
        }
        Insert: {
          conversion_rate?: number
          created_at?: string
          id?: string
          last_calculated_at?: string
          previous_score?: number
          product_id: string
          rating?: number
          return_rate?: number
          review_count?: number
          risk_penalty?: number
          sales_30d?: number
          sales_weight?: number
          score?: number
          seller_sla?: number
          trending_badge?: boolean
        }
        Update: {
          conversion_rate?: number
          created_at?: string
          id?: string
          last_calculated_at?: string
          previous_score?: number
          product_id?: string
          rating?: number
          return_rate?: number
          review_count?: number
          risk_penalty?: number
          sales_30d?: number
          sales_weight?: number
          score?: number
          seller_sla?: number
          trending_badge?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "product_ranking_scores_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: true
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_variants: {
        Row: {
          created_at: string
          id: string
          name: string
          options: Json | null
          price: number
          product_id: string
          sku: string | null
          stock_quantity: number
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          options?: Json | null
          price?: number
          product_id: string
          sku?: string | null
          stock_quantity?: number
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          options?: Json | null
          price?: number
          product_id?: string
          sku?: string | null
          stock_quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "product_variants_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          avg_rating: number | null
          barcode: string | null
          compare_at_price: number | null
          cost_price: number | null
          created_at: string
          description: string | null
          id: string
          images: Json | null
          is_marketplace_published: boolean
          is_published: boolean
          low_stock_threshold: number | null
          marketplace_category_id: string | null
          name: string
          price: number
          review_count: number | null
          sku: string | null
          slug: string
          stock_quantity: number
          store_id: string
          tags: string[] | null
          updated_at: string
          weight_grams: number | null
        }
        Insert: {
          avg_rating?: number | null
          barcode?: string | null
          compare_at_price?: number | null
          cost_price?: number | null
          created_at?: string
          description?: string | null
          id?: string
          images?: Json | null
          is_marketplace_published?: boolean
          is_published?: boolean
          low_stock_threshold?: number | null
          marketplace_category_id?: string | null
          name: string
          price?: number
          review_count?: number | null
          sku?: string | null
          slug: string
          stock_quantity?: number
          store_id: string
          tags?: string[] | null
          updated_at?: string
          weight_grams?: number | null
        }
        Update: {
          avg_rating?: number | null
          barcode?: string | null
          compare_at_price?: number | null
          cost_price?: number | null
          created_at?: string
          description?: string | null
          id?: string
          images?: Json | null
          is_marketplace_published?: boolean
          is_published?: boolean
          low_stock_threshold?: number | null
          marketplace_category_id?: string | null
          name?: string
          price?: number
          review_count?: number | null
          sku?: string | null
          slug?: string
          stock_quantity?: number
          store_id?: string
          tags?: string[] | null
          updated_at?: string
          weight_grams?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "products_marketplace_category_id_fkey"
            columns: ["marketplace_category_id"]
            isOneToOne: false
            referencedRelation: "marketplace_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          phone: string | null
          preferred_language: string
          selected_city_id: string | null
          selected_country_id: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          phone?: string | null
          preferred_language?: string
          selected_city_id?: string | null
          selected_country_id?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          preferred_language?: string
          selected_city_id?: string | null
          selected_country_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_selected_city_id_fkey"
            columns: ["selected_city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_selected_country_id_fkey"
            columns: ["selected_country_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
        ]
      }
      return_requests: {
        Row: {
          admin_notes: string | null
          buyer_id: string
          created_at: string
          description: string | null
          id: string
          images: Json | null
          order_id: string
          product_id: string | null
          reason: string
          seller_id: string
          status: Database["public"]["Enums"]["return_status"]
          store_id: string
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          buyer_id: string
          created_at?: string
          description?: string | null
          id?: string
          images?: Json | null
          order_id: string
          product_id?: string | null
          reason: string
          seller_id: string
          status?: Database["public"]["Enums"]["return_status"]
          store_id: string
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          buyer_id?: string
          created_at?: string
          description?: string | null
          id?: string
          images?: Json | null
          order_id?: string
          product_id?: string | null
          reason?: string
          seller_id?: string
          status?: Database["public"]["Enums"]["return_status"]
          store_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "return_requests_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "return_requests_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "return_requests_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          buyer_id: string
          comment: string | null
          created_at: string
          id: string
          images: Json | null
          is_approved: boolean
          is_verified: boolean
          order_id: string
          product_id: string
          rating: number
          store_id: string
          updated_at: string
        }
        Insert: {
          buyer_id: string
          comment?: string | null
          created_at?: string
          id?: string
          images?: Json | null
          is_approved?: boolean
          is_verified?: boolean
          order_id: string
          product_id: string
          rating: number
          store_id: string
          updated_at?: string
        }
        Update: {
          buyer_id?: string
          comment?: string | null
          created_at?: string
          id?: string
          images?: Json | null
          is_approved?: boolean
          is_verified?: boolean
          order_id?: string
          product_id?: string
          rating?: number
          store_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      risk_score_history: {
        Row: {
          change_reason: string
          changed_by: string | null
          created_at: string
          factors: Json
          id: string
          new_score: number
          previous_score: number | null
          target_id: string
          target_type: string
        }
        Insert: {
          change_reason?: string
          changed_by?: string | null
          created_at?: string
          factors?: Json
          id?: string
          new_score: number
          previous_score?: number | null
          target_id: string
          target_type: string
        }
        Update: {
          change_reason?: string
          changed_by?: string | null
          created_at?: string
          factors?: Json
          id?: string
          new_score?: number
          previous_score?: number | null
          target_id?: string
          target_type?: string
        }
        Relationships: []
      }
      saved_addresses: {
        Row: {
          address: string | null
          city_id: string | null
          city_name: string | null
          country_id: string | null
          created_at: string
          id: string
          is_default: boolean
          label: string
          latitude: number | null
          longitude: number | null
          notes: string | null
          quarter: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: string | null
          city_id?: string | null
          city_name?: string | null
          country_id?: string | null
          created_at?: string
          id?: string
          is_default?: boolean
          label?: string
          latitude?: number | null
          longitude?: number | null
          notes?: string | null
          quarter?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string | null
          city_id?: string | null
          city_name?: string | null
          country_id?: string | null
          created_at?: string
          id?: string
          is_default?: boolean
          label?: string
          latitude?: number | null
          longitude?: number | null
          notes?: string | null
          quarter?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_addresses_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saved_addresses_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
        ]
      }
      seller_financing_scores: {
        Row: {
          created_at: string
          eligibility_score: number
          frozen: boolean
          frozen_reason: string | null
          id: string
          is_eligible: boolean
          last_calculated_at: string
          max_eligible_amount: number
          reputation_score: number
          return_rate: number
          risk_score: number
          sales_90d: number
          store_id: string
        }
        Insert: {
          created_at?: string
          eligibility_score?: number
          frozen?: boolean
          frozen_reason?: string | null
          id?: string
          is_eligible?: boolean
          last_calculated_at?: string
          max_eligible_amount?: number
          reputation_score?: number
          return_rate?: number
          risk_score?: number
          sales_90d?: number
          store_id: string
        }
        Update: {
          created_at?: string
          eligibility_score?: number
          frozen?: boolean
          frozen_reason?: string | null
          id?: string
          is_eligible?: boolean
          last_calculated_at?: string
          max_eligible_amount?: number
          reputation_score?: number
          return_rate?: number
          risk_score?: number
          sales_90d?: number
          store_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "seller_financing_scores_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: true
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      seller_reputation: {
        Row: {
          avg_rating: number
          created_at: string
          delivery_speed_score: number
          id: string
          product_quality_score: number
          ranking_score: number
          reputation_score: number
          response_time_hours: number
          store_id: string
          total_reviews: number
          total_sales: number
          updated_at: string
          verified_badge: boolean
        }
        Insert: {
          avg_rating?: number
          created_at?: string
          delivery_speed_score?: number
          id?: string
          product_quality_score?: number
          ranking_score?: number
          reputation_score?: number
          response_time_hours?: number
          store_id: string
          total_reviews?: number
          total_sales?: number
          updated_at?: string
          verified_badge?: boolean
        }
        Update: {
          avg_rating?: number
          created_at?: string
          delivery_speed_score?: number
          id?: string
          product_quality_score?: number
          ranking_score?: number
          reputation_score?: number
          response_time_hours?: number
          store_id?: string
          total_reviews?: number
          total_sales?: number
          updated_at?: string
          verified_badge?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "seller_reputation_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: true
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      seller_risk_scores: {
        Row: {
          admin_override_by: string | null
          admin_override_reason: string | null
          admin_override_score: number | null
          cancellation_rate: number
          created_at: string
          dispute_rate: number
          factors: Json
          id: string
          last_calculated_at: string
          late_shipment_rate: number
          manual_review: boolean
          payouts_frozen: boolean
          return_rate: number
          score: number
          sla_compliance: number
          store_id: string
          total_orders: number
          updated_at: string
          visibility_reduced: boolean
        }
        Insert: {
          admin_override_by?: string | null
          admin_override_reason?: string | null
          admin_override_score?: number | null
          cancellation_rate?: number
          created_at?: string
          dispute_rate?: number
          factors?: Json
          id?: string
          last_calculated_at?: string
          late_shipment_rate?: number
          manual_review?: boolean
          payouts_frozen?: boolean
          return_rate?: number
          score?: number
          sla_compliance?: number
          store_id: string
          total_orders?: number
          updated_at?: string
          visibility_reduced?: boolean
        }
        Update: {
          admin_override_by?: string | null
          admin_override_reason?: string | null
          admin_override_score?: number | null
          cancellation_rate?: number
          created_at?: string
          dispute_rate?: number
          factors?: Json
          id?: string
          last_calculated_at?: string
          late_shipment_rate?: number
          manual_review?: boolean
          payouts_frozen?: boolean
          return_rate?: number
          score?: number
          sla_compliance?: number
          store_id?: string
          total_orders?: number
          updated_at?: string
          visibility_reduced?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "seller_risk_scores_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: true
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_locks: {
        Row: {
          expires_at: string
          id: string
          locked_at: string
          product_id: string
          quantity: number
          released: boolean
          session_id: string
          variant_id: string | null
        }
        Insert: {
          expires_at?: string
          id?: string
          locked_at?: string
          product_id: string
          quantity?: number
          released?: boolean
          session_id: string
          variant_id?: string | null
        }
        Update: {
          expires_at?: string
          id?: string
          locked_at?: string
          product_id?: string
          quantity?: number
          released?: boolean
          session_id?: string
          variant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_locks_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_locks_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      store_invitations: {
        Row: {
          accepted_by: string | null
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by: string
          role: Database["public"]["Enums"]["store_role"]
          status: Database["public"]["Enums"]["invitation_status"]
          store_id: string
          token_hash: string
          updated_at: string
        }
        Insert: {
          accepted_by?: string | null
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          invited_by: string
          role?: Database["public"]["Enums"]["store_role"]
          status?: Database["public"]["Enums"]["invitation_status"]
          store_id: string
          token_hash: string
          updated_at?: string
        }
        Update: {
          accepted_by?: string | null
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string
          role?: Database["public"]["Enums"]["store_role"]
          status?: Database["public"]["Enums"]["invitation_status"]
          store_id?: string
          token_hash?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "store_invitations_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      store_members: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["store_role"]
          store_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["store_role"]
          store_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["store_role"]
          store_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "store_members_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      store_tracking_settings: {
        Row: {
          created_at: string
          google_tag_id: string | null
          id: string
          meta_pixel_id: string | null
          pinterest_tag_id: string | null
          snapchat_pixel_id: string | null
          store_id: string
          tiktok_pixel_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          google_tag_id?: string | null
          id?: string
          meta_pixel_id?: string | null
          pinterest_tag_id?: string | null
          snapchat_pixel_id?: string | null
          store_id: string
          tiktok_pixel_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          google_tag_id?: string | null
          id?: string
          meta_pixel_id?: string | null
          pinterest_tag_id?: string | null
          snapchat_pixel_id?: string | null
          store_id?: string
          tiktok_pixel_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "store_tracking_settings_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: true
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      stores: {
        Row: {
          ban_reason: string | null
          city: string | null
          created_at: string
          currency: string
          delivery_delay: string | null
          description: string | null
          id: string
          is_active: boolean
          is_banned: boolean
          locale: string
          logo_url: string | null
          name: string
          owner_id: string
          plan: string
          return_policy: string | null
          settings: Json | null
          slug: string
          theme: Json | null
          updated_at: string
          workspace_id: string | null
        }
        Insert: {
          ban_reason?: string | null
          city?: string | null
          created_at?: string
          currency?: string
          delivery_delay?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          is_banned?: boolean
          locale?: string
          logo_url?: string | null
          name: string
          owner_id: string
          plan?: string
          return_policy?: string | null
          settings?: Json | null
          slug: string
          theme?: Json | null
          updated_at?: string
          workspace_id?: string | null
        }
        Update: {
          ban_reason?: string | null
          city?: string | null
          created_at?: string
          currency?: string
          delivery_delay?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          is_banned?: boolean
          locale?: string
          logo_url?: string | null
          name?: string
          owner_id?: string
          plan?: string
          return_policy?: string | null
          settings?: Json | null
          slug?: string
          theme?: Json | null
          updated_at?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stores_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      support_tickets: {
        Row: {
          buyer_id: string
          created_at: string
          escalated_at: string | null
          id: string
          order_id: string | null
          priority: Database["public"]["Enums"]["ticket_priority"]
          product_id: string | null
          resolved_at: string | null
          seller_id: string
          status: Database["public"]["Enums"]["ticket_status"]
          store_id: string
          subject: string
          updated_at: string
        }
        Insert: {
          buyer_id: string
          created_at?: string
          escalated_at?: string | null
          id?: string
          order_id?: string | null
          priority?: Database["public"]["Enums"]["ticket_priority"]
          product_id?: string | null
          resolved_at?: string | null
          seller_id: string
          status?: Database["public"]["Enums"]["ticket_status"]
          store_id: string
          subject: string
          updated_at?: string
        }
        Update: {
          buyer_id?: string
          created_at?: string
          escalated_at?: string | null
          id?: string
          order_id?: string | null
          priority?: Database["public"]["Enums"]["ticket_priority"]
          product_id?: string | null
          resolved_at?: string | null
          seller_id?: string
          status?: Database["public"]["Enums"]["ticket_status"]
          store_id?: string
          subject?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_tickets_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_tickets_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_tickets_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_messages: {
        Row: {
          attachments: Json | null
          created_at: string
          id: string
          message: string
          sender_id: string
          ticket_id: string
        }
        Insert: {
          attachments?: Json | null
          created_at?: string
          id?: string
          message: string
          sender_id: string
          ticket_id: string
        }
        Update: {
          attachments?: Json | null
          created_at?: string
          id?: string
          message?: string
          sender_id?: string
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_messages_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      tracking_events: {
        Row: {
          created_at: string
          currency: string
          event_count: number
          event_date: string
          event_type: string
          event_value: number
          id: string
          store_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          currency?: string
          event_count?: number
          event_date?: string
          event_type: string
          event_value?: number
          id?: string
          store_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          currency?: string
          event_count?: number
          event_date?: string
          event_type?: string
          event_value?: number
          id?: string
          store_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tracking_events_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      tracking_links: {
        Row: {
          campaign: string | null
          click_count: number
          content: string | null
          created_at: string
          id: string
          medium: string
          product_id: string | null
          short_code: string
          source: string
          store_id: string
          target_url: string
          updated_at: string
        }
        Insert: {
          campaign?: string | null
          click_count?: number
          content?: string | null
          created_at?: string
          id?: string
          medium?: string
          product_id?: string | null
          short_code: string
          source: string
          store_id: string
          target_url: string
          updated_at?: string
        }
        Update: {
          campaign?: string | null
          click_count?: number
          content?: string | null
          created_at?: string
          id?: string
          medium?: string
          product_id?: string | null
          short_code?: string
          source?: string
          store_id?: string
          target_url?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tracking_links_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tracking_links_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      tracking_sessions: {
        Row: {
          first_campaign: string | null
          first_content: string | null
          first_medium: string | null
          first_referrer: string | null
          first_seen_at: string
          first_source: string | null
          first_tracking_link_id: string | null
          id: string
          last_campaign: string | null
          last_content: string | null
          last_medium: string | null
          last_referrer: string | null
          last_seen_at: string
          last_source: string | null
          last_tracking_link_id: string | null
          page_views: number
          session_id: string
          store_id: string
        }
        Insert: {
          first_campaign?: string | null
          first_content?: string | null
          first_medium?: string | null
          first_referrer?: string | null
          first_seen_at?: string
          first_source?: string | null
          first_tracking_link_id?: string | null
          id?: string
          last_campaign?: string | null
          last_content?: string | null
          last_medium?: string | null
          last_referrer?: string | null
          last_seen_at?: string
          last_source?: string | null
          last_tracking_link_id?: string | null
          page_views?: number
          session_id: string
          store_id: string
        }
        Update: {
          first_campaign?: string | null
          first_content?: string | null
          first_medium?: string | null
          first_referrer?: string | null
          first_seen_at?: string
          first_source?: string | null
          first_tracking_link_id?: string | null
          id?: string
          last_campaign?: string | null
          last_content?: string | null
          last_medium?: string | null
          last_referrer?: string | null
          last_seen_at?: string
          last_source?: string | null
          last_tracking_link_id?: string | null
          page_views?: number
          session_id?: string
          store_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tracking_sessions_first_tracking_link_id_fkey"
            columns: ["first_tracking_link_id"]
            isOneToOne: false
            referencedRelation: "tracking_links"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tracking_sessions_last_tracking_link_id_fkey"
            columns: ["last_tracking_link_id"]
            isOneToOne: false
            referencedRelation: "tracking_links"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tracking_sessions_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      user_risk_scores: {
        Row: {
          admin_override_by: string | null
          admin_override_reason: string | null
          admin_override_score: number | null
          cod_disabled: boolean
          cod_failure_rate: number
          created_at: string
          dispute_rate: number
          factors: Json
          id: string
          last_calculated_at: string
          manual_review: boolean
          payment_failure_rate: number
          return_rate: number
          score: number
          total_orders: number
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_override_by?: string | null
          admin_override_reason?: string | null
          admin_override_score?: number | null
          cod_disabled?: boolean
          cod_failure_rate?: number
          created_at?: string
          dispute_rate?: number
          factors?: Json
          id?: string
          last_calculated_at?: string
          manual_review?: boolean
          payment_failure_rate?: number
          return_rate?: number
          score?: number
          total_orders?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_override_by?: string | null
          admin_override_reason?: string | null
          admin_override_score?: number | null
          cod_disabled?: boolean
          cod_failure_rate?: number
          created_at?: string
          dispute_rate?: number
          factors?: Json
          id?: string
          last_calculated_at?: string
          manual_review?: boolean
          payment_failure_rate?: number
          return_rate?: number
          score?: number
          total_orders?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_security_settings: {
        Row: {
          created_at: string
          id: string
          require_2fa_withdrawal: boolean
          two_factor_enabled: boolean
          two_factor_method: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          require_2fa_withdrawal?: boolean
          two_factor_enabled?: boolean
          two_factor_method?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          require_2fa_withdrawal?: boolean
          two_factor_enabled?: boolean
          two_factor_method?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      vendor_expenses: {
        Row: {
          amount: number
          category: string
          created_at: string
          created_by: string | null
          currency: string
          expense_date: string
          id: string
          label: string
          notes: string | null
          store_id: string
          updated_at: string
        }
        Insert: {
          amount?: number
          category?: string
          created_at?: string
          created_by?: string | null
          currency?: string
          expense_date?: string
          id?: string
          label: string
          notes?: string | null
          store_id: string
          updated_at?: string
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string
          created_by?: string | null
          currency?: string
          expense_date?: string
          id?: string
          label?: string
          notes?: string | null
          store_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendor_expenses_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      vendor_kyc: {
        Row: {
          created_at: string
          id: string
          id_document_type: string | null
          id_document_url: string | null
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          selfie_url: string | null
          status: Database["public"]["Enums"]["kyc_status"]
          store_id: string | null
          submitted_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          id_document_type?: string | null
          id_document_url?: string | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          selfie_url?: string | null
          status?: Database["public"]["Enums"]["kyc_status"]
          store_id?: string | null
          submitted_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          id_document_type?: string | null
          id_document_url?: string | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          selfie_url?: string | null
          status?: Database["public"]["Enums"]["kyc_status"]
          store_id?: string | null
          submitted_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendor_kyc_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      wallet_transactions: {
        Row: {
          amount: number
          created_at: string
          description: string | null
          id: string
          reference_id: string | null
          type: Database["public"]["Enums"]["wallet_tx_type"]
          wallet_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          description?: string | null
          id?: string
          reference_id?: string | null
          type: Database["public"]["Enums"]["wallet_tx_type"]
          wallet_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string | null
          id?: string
          reference_id?: string | null
          type?: Database["public"]["Enums"]["wallet_tx_type"]
          wallet_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wallet_transactions_wallet_id_fkey"
            columns: ["wallet_id"]
            isOneToOne: false
            referencedRelation: "wallets"
            referencedColumns: ["id"]
          },
        ]
      }
      wallets: {
        Row: {
          balance_available: number
          balance_pending: number
          created_at: string
          currency: string
          id: string
          store_id: string
          updated_at: string
        }
        Insert: {
          balance_available?: number
          balance_pending?: number
          created_at?: string
          currency?: string
          id?: string
          store_id: string
          updated_at?: string
        }
        Update: {
          balance_available?: number
          balance_pending?: number
          created_at?: string
          currency?: string
          id?: string
          store_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "wallets_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: true
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      warehouse_inventory: {
        Row: {
          created_at: string
          id: string
          product_id: string
          quantity: number
          reserved_quantity: number
          store_id: string
          updated_at: string
          warehouse_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          quantity?: number
          reserved_quantity?: number
          store_id: string
          updated_at?: string
          warehouse_id: string
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          quantity?: number
          reserved_quantity?: number
          store_id?: string
          updated_at?: string
          warehouse_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "warehouse_inventory_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "warehouse_inventory_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "warehouse_inventory_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      warehouses: {
        Row: {
          address: string | null
          capacity: number
          city: string
          country_id: string | null
          created_at: string
          current_occupancy: number
          id: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          capacity?: number
          city: string
          country_id?: string | null
          created_at?: string
          current_occupancy?: number
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          capacity?: number
          city?: string
          country_id?: string | null
          created_at?: string
          current_occupancy?: number
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "warehouses_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
        ]
      }
      wishlists: {
        Row: {
          created_at: string
          id: string
          product_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wishlists_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_members: {
        Row: {
          created_at: string
          id: string
          role: string
          user_id: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: string
          user_id: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: string
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_members_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspaces: {
        Row: {
          created_at: string
          id: string
          name: string
          owner_user_id: string
          plan_limit_stores: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          owner_user_id: string
          plan_limit_stores?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          owner_user_id?: string
          plan_limit_stores?: number
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      accept_admin_invitation: {
        Args: { _token_hash: string; _user_id: string }
        Returns: Json
      }
      accept_financing_offer: {
        Args: { _offer_id: string; _user_id: string }
        Returns: Json
      }
      accept_invitation: {
        Args: { _token_hash: string; _user_id: string }
        Returns: Json
      }
      assign_fulfillment: { Args: { _order_id: string }; Returns: Json }
      can_access_ticket: {
        Args: { _ticket_id: string; _user_id: string }
        Returns: boolean
      }
      can_review_order: {
        Args: { _order_id: string; _user_id: string }
        Returns: boolean
      }
      check_login_rate_limit: {
        Args: {
          _identifier: string
          _max_attempts?: number
          _window_minutes?: number
        }
        Returns: boolean
      }
      create_escrow_for_order: {
        Args: { _commission_rate?: number; _order_id: string }
        Returns: string
      }
      decrement_stock: {
        Args: { _product_id: string; _quantity: number }
        Returns: boolean
      }
      ensure_wallet: { Args: { _store_id: string }; Returns: string }
      get_member_permissions: {
        Args: { _store_id: string; _user_id: string }
        Returns: string[]
      }
      get_store_id_for_order: { Args: { _order_id: string }; Returns: string }
      get_store_id_for_product: {
        Args: { _product_id: string }
        Returns: string
      }
      get_store_role: {
        Args: { _store_id: string; _user_id: string }
        Returns: string
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_tracking_link_click: {
        Args: { _short_code: string }
        Returns: undefined
      }
      is_store_admin_or_owner: {
        Args: { _store_id: string; _user_id: string }
        Returns: boolean
      }
      is_store_member: {
        Args: { _store_id: string; _user_id: string }
        Returns: boolean
      }
      is_workspace_admin_or_owner: {
        Args: { _user_id: string; _workspace_id: string }
        Returns: boolean
      }
      is_workspace_member: {
        Args: { _user_id: string; _workspace_id: string }
        Returns: boolean
      }
      process_financing_repayment: {
        Args: { _payout_amount: number; _store_id: string }
        Returns: Json
      }
      receive_inbound_shipment: {
        Args: { _shipment_id: string }
        Returns: Json
      }
      release_escrow: { Args: { _escrow_id: string }; Returns: boolean }
      release_expired_stock_locks: { Args: never; Returns: number }
      request_payout: {
        Args: {
          _amount: number
          _payment_details?: Json
          _payment_method?: string
          _store_id: string
        }
        Returns: string
      }
      upsert_checkout_customer:
        | {
            Args: {
              _address?: string
              _city?: string
              _first_name: string
              _last_name?: string
              _phone?: string
              _quarter?: string
              _store_id: string
            }
            Returns: string
          }
        | {
            Args: {
              _address?: string
              _city?: string
              _first_name: string
              _last_name?: string
              _phone?: string
              _quarter?: string
              _store_id: string
              _user_id?: string
            }
            Returns: string
          }
      upsert_tracking_event: {
        Args: {
          _currency?: string
          _event_date: string
          _event_type: string
          _store_id: string
          _value?: number
        }
        Returns: undefined
      }
    }
    Enums: {
      app_role:
        | "marketplace_admin"
        | "marketplace_moderator"
        | "client"
        | "vendor"
      discount_type: "percentage" | "fixed"
      escrow_status: "held" | "released" | "refunded" | "disputed"
      financing_offer_status:
        | "offered"
        | "accepted"
        | "active"
        | "closed"
        | "defaulted"
      fulfillment_type: "seller" | "feyxa"
      invitation_status: "pending" | "accepted" | "expired" | "revoked"
      kyc_status: "not_started" | "pending" | "approved" | "rejected"
      landing_status: "draft" | "published" | "archived"
      marketplace_listing_status:
        | "hidden"
        | "submitted"
        | "approved"
        | "published"
        | "rejected"
      order_status:
        | "new"
        | "confirmed"
        | "packed"
        | "shipped"
        | "delivered"
        | "cancelled"
        | "refunded"
        | "dispute"
      outbound_status:
        | "pending"
        | "picking"
        | "packed"
        | "shipped"
        | "delivered"
        | "cancelled"
      payment_status: "pending" | "paid" | "cod" | "failed" | "refunded"
      payout_status: "pending" | "approved" | "paid" | "rejected"
      return_status:
        | "requested"
        | "reviewing"
        | "approved"
        | "rejected"
        | "received"
        | "refunded"
      shipment_status: "draft" | "in_transit" | "received" | "cancelled"
      store_role:
        | "owner"
        | "admin"
        | "staff"
        | "manager"
        | "support"
        | "finance"
        | "viewer"
      ticket_priority: "low" | "medium" | "high" | "urgent"
      ticket_status:
        | "open"
        | "pending_seller"
        | "pending_customer"
        | "resolved"
        | "escalated"
      wallet_tx_type:
        | "escrow_hold"
        | "escrow_release"
        | "commission"
        | "payout"
        | "refund"
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
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
      app_role: [
        "marketplace_admin",
        "marketplace_moderator",
        "client",
        "vendor",
      ],
      discount_type: ["percentage", "fixed"],
      escrow_status: ["held", "released", "refunded", "disputed"],
      financing_offer_status: [
        "offered",
        "accepted",
        "active",
        "closed",
        "defaulted",
      ],
      fulfillment_type: ["seller", "feyxa"],
      invitation_status: ["pending", "accepted", "expired", "revoked"],
      kyc_status: ["not_started", "pending", "approved", "rejected"],
      landing_status: ["draft", "published", "archived"],
      marketplace_listing_status: [
        "hidden",
        "submitted",
        "approved",
        "published",
        "rejected",
      ],
      order_status: [
        "new",
        "confirmed",
        "packed",
        "shipped",
        "delivered",
        "cancelled",
        "refunded",
        "dispute",
      ],
      outbound_status: [
        "pending",
        "picking",
        "packed",
        "shipped",
        "delivered",
        "cancelled",
      ],
      payment_status: ["pending", "paid", "cod", "failed", "refunded"],
      payout_status: ["pending", "approved", "paid", "rejected"],
      return_status: [
        "requested",
        "reviewing",
        "approved",
        "rejected",
        "received",
        "refunded",
      ],
      shipment_status: ["draft", "in_transit", "received", "cancelled"],
      store_role: [
        "owner",
        "admin",
        "staff",
        "manager",
        "support",
        "finance",
        "viewer",
      ],
      ticket_priority: ["low", "medium", "high", "urgent"],
      ticket_status: [
        "open",
        "pending_seller",
        "pending_customer",
        "resolved",
        "escalated",
      ],
      wallet_tx_type: [
        "escrow_hold",
        "escrow_release",
        "commission",
        "payout",
        "refund",
      ],
    },
  },
} as const
