ALTER TABLE "base_sku_mockups" DROP CONSTRAINT "base_sku_mockups_base_view_unique";--> statement-breakpoint
DROP INDEX "base_sku_mockups_is_hero_idx";--> statement-breakpoint
ALTER TABLE "base_sku_mockups" ADD COLUMN "purpose" text NOT NULL;--> statement-breakpoint
CREATE INDEX "base_sku_mockups_purpose_idx" ON "base_sku_mockups" USING btree ("purpose");--> statement-breakpoint
ALTER TABLE "base_sku_mockups" DROP COLUMN "is_hero";