DO $$ BEGIN
  ALTER TABLE "base_sku_mockups" DROP CONSTRAINT "base_sku_mockups_base_view_color_unique";
EXCEPTION WHEN undefined_object THEN NULL; END $$;--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "base_sku_mockups" DROP CONSTRAINT "base_sku_mockups_color_value_id_attribute_values_id_fk";
EXCEPTION WHEN undefined_object THEN NULL; END $$;--> statement-breakpoint
DROP INDEX IF EXISTS "base_sku_mockups_color_value_id_idx";--> statement-breakpoint
ALTER TABLE "base_sku_attribute_rules" ALTER COLUMN "value_set_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "base_sku_attribute_rules" ADD COLUMN "value_id" uuid;--> statement-breakpoint
ALTER TABLE "base_sku_attribute_rules" ADD CONSTRAINT "base_sku_attribute_rules_value_id_attribute_values_id_fk" FOREIGN KEY ("value_id") REFERENCES "public"."attribute_values"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "base_sku_mockups" DROP COLUMN IF EXISTS "color_value_id";--> statement-breakpoint
ALTER TABLE "base_sku_mockups" ADD CONSTRAINT "base_sku_mockups_base_view_unique" UNIQUE("base_sku_id","view_id");--> statement-breakpoint
ALTER TABLE "base_sku_attribute_rules" ADD CONSTRAINT "rule_type_chk" CHECK (
          (value_set_id IS NOT NULL AND value_id IS NULL) OR
          (value_set_id IS NULL AND value_id IS NOT NULL)
        );
