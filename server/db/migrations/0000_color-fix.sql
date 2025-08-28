CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text,
	"email_verified" boolean NOT NULL,
	"image" text,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "base_sku_attribute_rules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"base_sku_id" uuid NOT NULL,
	"attribute_id" uuid NOT NULL,
	"value_set_id" uuid NOT NULL,
	"is_variant_defining" boolean DEFAULT false NOT NULL,
	"is_required" boolean DEFAULT false NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "base_sku_attribute_rules_unique" UNIQUE("base_sku_id","attribute_id")
);
--> statement-breakpoint
CREATE TABLE "base_sku_mockups" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"base_sku_id" uuid NOT NULL,
	"view_id" uuid NOT NULL,
	"color_value_id" uuid NOT NULL,
	"r2_key" text NOT NULL,
	"is_hero" boolean DEFAULT false NOT NULL,
	"source_width_px" integer NOT NULL,
	"source_height_px" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "base_sku_mockups_base_view_color_unique" UNIQUE("base_sku_id","view_id","color_value_id")
);
--> statement-breakpoint
CREATE TABLE "base_sku_print_areas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"base_sku_id" uuid NOT NULL,
	"view_id" uuid NOT NULL,
	"x_px" integer NOT NULL,
	"y_px" integer NOT NULL,
	"width_px" integer NOT NULL,
	"height_px" integer NOT NULL,
	"dpi" integer DEFAULT 300 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "base_sku_print_areas_view_unique" UNIQUE("view_id"),
	CONSTRAINT "positive_dimensions" CHECK (width_px > 0 AND height_px > 0),
	CONSTRAINT "positive_coordinates" CHECK (x_px >= 0 AND y_px >= 0)
);
--> statement-breakpoint
CREATE TABLE "base_sku_views" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"base_sku_id" uuid NOT NULL,
	"code" text NOT NULL,
	"display_name" text NOT NULL,
	"order" integer DEFAULT 0 NOT NULL,
	"source_width_px" integer NOT NULL,
	"source_height_px" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "base_sku_views_base_sku_code_unique" UNIQUE("base_sku_id","code")
);
--> statement-breakpoint
CREATE TABLE "base_skus" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"category_id" uuid NOT NULL,
	"cost" bigint NOT NULL,
	"print_spec" json,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "base_skus_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "attribute_value_set_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"value_set_id" uuid NOT NULL,
	"value_id" uuid NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "attribute_value_set_members_unique" UNIQUE("value_set_id","value_id")
);
--> statement-breakpoint
CREATE TABLE "attribute_value_sets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"attribute_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "attribute_value_sets_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "attribute_values" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text NOT NULL,
	"display_name" text NOT NULL,
	"hex_color" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "attribute_values_hex_color_format_chk" CHECK (("attribute_values"."hex_color" IS NULL) OR ("attribute_values"."hex_color" ~* '^#([0-9A-F]{6})$'))
);
--> statement-breakpoint
CREATE TABLE "attributes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"data_type" text DEFAULT 'string' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "attributes_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"parent_id" uuid,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"level" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "categories_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "creators" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"creator_slug" text NOT NULL,
	"store_name" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "creators_user_id_unique" UNIQUE("user_id"),
	CONSTRAINT "creators_creator_slug_unique" UNIQUE("creator_slug")
);
--> statement-breakpoint
CREATE TABLE "waitlist" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	CONSTRAINT "waitlist_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "product_variants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"sku" text NOT NULL,
	"combo_hash" text NOT NULL,
	"price" bigint,
	"primary_mockup_r2_key" text,
	"secondary_mockup_r2_key" text,
	"print_file_r2_key" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "product_variants_sku_unique" UNIQUE("sku"),
	CONSTRAINT "product_variants_product_combo_unique" UNIQUE("product_id","combo_hash")
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"creator_id" uuid NOT NULL,
	"base_sku_id" uuid NOT NULL,
	"title" text NOT NULL,
	"slug" text NOT NULL,
	"design_r2_key" text NOT NULL,
	"placement_by_view" json NOT NULL,
	"price" bigint NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "products_slug_unique" UNIQUE("slug"),
	CONSTRAINT "products_creator_slug_unique" UNIQUE("creator_id","slug")
);
--> statement-breakpoint
CREATE TABLE "variant_attribute_values" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"variant_id" uuid NOT NULL,
	"attribute_id" uuid NOT NULL,
	"attribute_value_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "variant_attribute_values_unique" UNIQUE("variant_id","attribute_id")
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "base_sku_attribute_rules" ADD CONSTRAINT "base_sku_attribute_rules_base_sku_id_base_skus_id_fk" FOREIGN KEY ("base_sku_id") REFERENCES "public"."base_skus"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "base_sku_attribute_rules" ADD CONSTRAINT "base_sku_attribute_rules_attribute_id_attributes_id_fk" FOREIGN KEY ("attribute_id") REFERENCES "public"."attributes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "base_sku_attribute_rules" ADD CONSTRAINT "base_sku_attribute_rules_value_set_id_attribute_value_sets_id_fk" FOREIGN KEY ("value_set_id") REFERENCES "public"."attribute_value_sets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "base_sku_mockups" ADD CONSTRAINT "base_sku_mockups_base_sku_id_base_skus_id_fk" FOREIGN KEY ("base_sku_id") REFERENCES "public"."base_skus"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "base_sku_mockups" ADD CONSTRAINT "base_sku_mockups_view_id_base_sku_views_id_fk" FOREIGN KEY ("view_id") REFERENCES "public"."base_sku_views"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "base_sku_mockups" ADD CONSTRAINT "base_sku_mockups_color_value_id_attribute_values_id_fk" FOREIGN KEY ("color_value_id") REFERENCES "public"."attribute_values"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "base_sku_print_areas" ADD CONSTRAINT "base_sku_print_areas_base_sku_id_base_skus_id_fk" FOREIGN KEY ("base_sku_id") REFERENCES "public"."base_skus"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "base_sku_print_areas" ADD CONSTRAINT "base_sku_print_areas_view_id_base_sku_views_id_fk" FOREIGN KEY ("view_id") REFERENCES "public"."base_sku_views"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "base_sku_views" ADD CONSTRAINT "base_sku_views_base_sku_id_base_skus_id_fk" FOREIGN KEY ("base_sku_id") REFERENCES "public"."base_skus"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "base_skus" ADD CONSTRAINT "base_skus_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attribute_value_set_members" ADD CONSTRAINT "attribute_value_set_members_value_set_id_attribute_value_sets_id_fk" FOREIGN KEY ("value_set_id") REFERENCES "public"."attribute_value_sets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attribute_value_set_members" ADD CONSTRAINT "attribute_value_set_members_value_id_attribute_values_id_fk" FOREIGN KEY ("value_id") REFERENCES "public"."attribute_values"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attribute_value_sets" ADD CONSTRAINT "attribute_value_sets_attribute_id_attributes_id_fk" FOREIGN KEY ("attribute_id") REFERENCES "public"."attributes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "creators" ADD CONSTRAINT "creators_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_creator_id_creators_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."creators"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_base_sku_id_base_skus_id_fk" FOREIGN KEY ("base_sku_id") REFERENCES "public"."base_skus"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "variant_attribute_values" ADD CONSTRAINT "variant_attribute_values_variant_id_product_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."product_variants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "variant_attribute_values" ADD CONSTRAINT "variant_attribute_values_attribute_id_attributes_id_fk" FOREIGN KEY ("attribute_id") REFERENCES "public"."attributes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "variant_attribute_values" ADD CONSTRAINT "variant_attribute_values_attribute_value_id_attribute_values_id_fk" FOREIGN KEY ("attribute_value_id") REFERENCES "public"."attribute_values"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "account_user_id_idx" ON "account" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "account_provider_account_idx" ON "account" USING btree ("provider_id","account_id");--> statement-breakpoint
CREATE INDEX "account_access_token_expires_idx" ON "account" USING btree ("access_token_expires_at");--> statement-breakpoint
CREATE INDEX "session_user_id_idx" ON "session" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "session_token_idx" ON "session" USING btree ("token");--> statement-breakpoint
CREATE INDEX "session_expires_at_idx" ON "session" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "session_user_expires_idx" ON "session" USING btree ("user_id","expires_at");--> statement-breakpoint
CREATE INDEX "user_email_idx" ON "user" USING btree ("email");--> statement-breakpoint
CREATE INDEX "user_phone_idx" ON "user" USING btree ("phone");--> statement-breakpoint
CREATE INDEX "verification_identifier_idx" ON "verification" USING btree ("identifier");--> statement-breakpoint
CREATE INDEX "verification_expires_at_idx" ON "verification" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "verification_identifier_expires_idx" ON "verification" USING btree ("identifier","expires_at");--> statement-breakpoint
CREATE INDEX "base_sku_attribute_rules_base_sku_id_idx" ON "base_sku_attribute_rules" USING btree ("base_sku_id");--> statement-breakpoint
CREATE INDEX "base_sku_attribute_rules_attribute_id_idx" ON "base_sku_attribute_rules" USING btree ("attribute_id");--> statement-breakpoint
CREATE INDEX "base_sku_attribute_rules_value_set_id_idx" ON "base_sku_attribute_rules" USING btree ("value_set_id");--> statement-breakpoint
CREATE INDEX "base_sku_attribute_rules_position_idx" ON "base_sku_attribute_rules" USING btree ("position");--> statement-breakpoint
CREATE INDEX "base_sku_mockups_base_sku_id_idx" ON "base_sku_mockups" USING btree ("base_sku_id");--> statement-breakpoint
CREATE INDEX "base_sku_mockups_view_id_idx" ON "base_sku_mockups" USING btree ("view_id");--> statement-breakpoint
CREATE INDEX "base_sku_mockups_color_value_id_idx" ON "base_sku_mockups" USING btree ("color_value_id");--> statement-breakpoint
CREATE INDEX "base_sku_mockups_is_hero_idx" ON "base_sku_mockups" USING btree ("is_hero");--> statement-breakpoint
CREATE INDEX "base_sku_print_areas_base_sku_id_idx" ON "base_sku_print_areas" USING btree ("base_sku_id");--> statement-breakpoint
CREATE INDEX "base_sku_print_areas_view_id_idx" ON "base_sku_print_areas" USING btree ("view_id");--> statement-breakpoint
CREATE INDEX "base_sku_views_base_sku_id_idx" ON "base_sku_views" USING btree ("base_sku_id");--> statement-breakpoint
CREATE INDEX "base_sku_views_code_idx" ON "base_sku_views" USING btree ("code");--> statement-breakpoint
CREATE INDEX "base_sku_views_order_idx" ON "base_sku_views" USING btree ("order");--> statement-breakpoint
CREATE INDEX "base_skus_code_idx" ON "base_skus" USING btree ("code");--> statement-breakpoint
CREATE INDEX "base_skus_category_id_idx" ON "base_skus" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "base_skus_status_idx" ON "base_skus" USING btree ("status");--> statement-breakpoint
CREATE INDEX "attribute_value_set_members_set_idx" ON "attribute_value_set_members" USING btree ("value_set_id");--> statement-breakpoint
CREATE INDEX "attribute_value_set_members_value_idx" ON "attribute_value_set_members" USING btree ("value_id");--> statement-breakpoint
CREATE INDEX "attribute_value_set_members_sort_idx" ON "attribute_value_set_members" USING btree ("sort_order");--> statement-breakpoint
CREATE INDEX "attribute_value_sets_code_idx" ON "attribute_value_sets" USING btree ("code");--> statement-breakpoint
CREATE INDEX "attribute_value_sets_attribute_id_idx" ON "attribute_value_sets" USING btree ("attribute_id");--> statement-breakpoint
CREATE INDEX "attribute_values_code_idx" ON "attribute_values" USING btree ("code");--> statement-breakpoint
CREATE INDEX "attribute_values_sort_order_idx" ON "attribute_values" USING btree ("sort_order");--> statement-breakpoint
CREATE UNIQUE INDEX "attribute_values_hex_color_ci_uidx" ON "attribute_values" USING btree (lower("hex_color"));--> statement-breakpoint
CREATE INDEX "attributes_code_idx" ON "attributes" USING btree ("code");--> statement-breakpoint
CREATE INDEX "attributes_data_type_idx" ON "attributes" USING btree ("data_type");--> statement-breakpoint
CREATE INDEX "categories_parent_id_idx" ON "categories" USING btree ("parent_id");--> statement-breakpoint
CREATE INDEX "categories_slug_idx" ON "categories" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "categories_level_idx" ON "categories" USING btree ("level");--> statement-breakpoint
CREATE INDEX "product_variants_product_id_idx" ON "product_variants" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "product_variants_sku_idx" ON "product_variants" USING btree ("sku");--> statement-breakpoint
CREATE INDEX "product_variants_combo_hash_idx" ON "product_variants" USING btree ("combo_hash");--> statement-breakpoint
CREATE INDEX "products_creator_id_idx" ON "products" USING btree ("creator_id");--> statement-breakpoint
CREATE INDEX "products_base_sku_id_idx" ON "products" USING btree ("base_sku_id");--> statement-breakpoint
CREATE INDEX "products_slug_idx" ON "products" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "products_status_idx" ON "products" USING btree ("status");--> statement-breakpoint
CREATE INDEX "products_created_at_idx" ON "products" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "variant_attribute_values_variant_id_idx" ON "variant_attribute_values" USING btree ("variant_id");--> statement-breakpoint
CREATE INDEX "variant_attribute_values_attribute_id_idx" ON "variant_attribute_values" USING btree ("attribute_id");--> statement-breakpoint
CREATE INDEX "variant_attribute_values_attribute_value_id_idx" ON "variant_attribute_values" USING btree ("attribute_value_id");