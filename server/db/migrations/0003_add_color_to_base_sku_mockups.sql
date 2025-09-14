-- Add nullable color to base_sku_mockups tied to attribute_values
ALTER TABLE "base_sku_mockups" ADD COLUMN IF NOT EXISTS "color_value_id" uuid;--> statement-breakpoint

-- Add FK to attribute_values (nullable)
DO $$ BEGIN
  ALTER TABLE "base_sku_mockups" ADD CONSTRAINT "base_sku_mockups_color_value_id_attribute_values_id_fk"
    FOREIGN KEY ("color_value_id") REFERENCES "public"."attribute_values"("id")
    ON DELETE SET NULL ON UPDATE NO ACTION;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint

-- Index for faster lookups by color
CREATE INDEX IF NOT EXISTS "base_sku_mockups_color_value_id_idx" ON "base_sku_mockups" USING btree ("color_value_id");--> statement-breakpoint
