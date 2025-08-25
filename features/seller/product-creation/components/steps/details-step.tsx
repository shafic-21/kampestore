"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import {
  Plus,
  ChevronDown,
  ChevronRight,
  Info,
  Trash2,
  Loader2,
} from "lucide-react";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Alert, AlertDescription } from "@/components/ui/alert";

// Import existing components (these would be imported from your actual paths)
import { CascadingCategorySelect } from "@/features/categories/components/cascading-category-select";
import { CreatableBrandCombobox } from "@/features/brands/components/creatable-brand-combobox";
import { CountrySelector } from "../country-selector";
import { SpecificationInput } from "../specification-input";

// Validation schema
const detailsStepSchema = z.object({
  title: z
    .string()
    .min(10, "Title must be at least 10 characters")
    .max(200, "Title must be less than 200 characters"),
  leafCategoryId: z.string().min(1, "Category is required"),
  brandId: z.string().optional(),
  gtin: z.string().optional(),
  countryOfOrigin: z.string().optional(),
  hasVariants: z.boolean(),
  variantDefiningAttributes: z.array(z.string()),
  highlights: z.array(z.string()).max(5, "Maximum 5 highlights allowed"),
  specifications: z.array(
    z.object({
      attributeId: z.string(),
      attributeCode: z.string(),
      attributeName: z.string(),
      value: z.string(),
      unit: z.string().nullable(),
    })
  ),
});

type DetailsStepFormData = z.infer<typeof detailsStepSchema>;

interface DetailsStepProps {
  onNext: () => void;
  onPrevious: () => void;
}

// Available variant attributes
const VARIANT_ATTRIBUTES = [
  { id: "color", label: "Color" },
  { id: "size", label: "Size" },
  { id: "material", label: "Material" },
  { id: "storage", label: "Storage" },
  { id: "style", label: "Style" },
];

export default function DetailsStep({ onNext, onPrevious }: DetailsStepProps) {
  const [newHighlight, setNewHighlight] = useState("");
  const [specsExpanded, setSpecsExpanded] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<DetailsStepFormData>({
    resolver: zodResolver(detailsStepSchema),
    defaultValues: {
      title: "",
      leafCategoryId: "",
      brandId: "",
      gtin: "",
      countryOfOrigin: "",
      hasVariants: false,
      variantDefiningAttributes: [],
      highlights: [],
      specifications: [],
    },
  });

  const {
    control,
    watch,
    setValue,
    handleSubmit,
    formState: { errors },
    trigger,
  } = form;

  const watchedHasVariants = watch("hasVariants");
  const watchedHighlights = watch("highlights");
  const watchedLeafCategoryId = watch("leafCategoryId");
  const watchedSpecs = watch("specifications");

  // Add highlight function
  const addHighlight = () => {
    const trimmed = newHighlight.trim();
    if (trimmed && trimmed.length <= 150 && watchedHighlights.length < 5) {
      const currentHighlights = watchedHighlights || [];
      if (!currentHighlights.includes(trimmed)) {
        setValue("highlights", [...currentHighlights, trimmed]);
        setNewHighlight("");
      }
    }
  };

  // Remove highlight function
  const removeHighlight = (index: number) => {
    const currentHighlights = watchedHighlights || [];
    setValue(
      "highlights",
      currentHighlights.filter((_, i) => i !== index)
    );
  };

  // Handle form submission
  const onSubmit = async (data: DetailsStepFormData) => {
    setIsSubmitting(true);
    try {
      // Here you would save the data to your store/API
      console.log("Form data:", data);

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      onNext();
    } catch (error) {
      console.error("Error submitting form:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-semibold">Product Details</h2>
        <p className="text-muted-foreground mt-1">
          Enter the essential information about your product
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Product Information Card */}
          <Card>
            <CardHeader>
              <CardTitle>Product Information</CardTitle>
              <CardDescription>
                Basic details that identify your product
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Product Title */}
              <FormField
                control={control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Product Title *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g. Premium Wireless Bluetooth Headphones"
                        {...field}
                        className="text-base"
                      />
                    </FormControl>
                    <FormDescription>
                      {field.value?.length || 0}/200 characters (minimum 10)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Category */}
              <FormField
                control={control}
                name="leafCategoryId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category *</FormLabel>
                    <CascadingCategorySelect
                      onLeafCategorySelect={(categoryId, path) => {
                        field.onChange(categoryId);
                        trigger("leafCategoryId");
                      }}
                      initialLeafCategoryId={field.value}
                    />
                    <FormDescription>
                      Select the most specific category that matches your
                      product
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Brand */}
              <FormField
                control={control}
                name="brandId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Brand</FormLabel>
                    <CreatableBrandCombobox
                      initialBrandId={field.value}
                      onBrandSelect={(brandId) => {
                        field.onChange(brandId);
                        trigger("brandId");
                      }}
                    />
                    <FormDescription>
                      Select an existing brand or create a new one
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* GTIN/Barcode */}
              <FormField
                control={control}
                name="gtin"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>GTIN/Barcode</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. 1234567890123" {...field} />
                    </FormControl>
                    <FormDescription>
                      Global Trade Item Number (UPC, EAN, ISBN, etc.) - Optional
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Country of Origin */}
              <FormField
                control={control}
                name="countryOfOrigin"
                render={({ field }) => (
                  <CountrySelector
                    value={field.value || ""}
                    onChange={(countryCode) => {
                      field.onChange(countryCode);
                      trigger("countryOfOrigin");
                    }}
                  />
                )}
              />
            </CardContent>
          </Card>

          {/* Product Structure Card */}
          <Card>
            <CardHeader>
              <CardTitle>Product Structure</CardTitle>
              <CardDescription>
                Define if your product has different variants
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Has Variants */}
              <FormField
                control={control}
                name="hasVariants"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Does this product have variants?</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={(value) =>
                          field.onChange(value === "yes")
                        }
                        value={field.value ? "yes" : "no"}
                        className="flex flex-col space-y-2"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="no" id="no-variants" />
                          <Label htmlFor="no-variants">
                            No - This is a single product
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="yes" id="has-variants" />
                          <Label htmlFor="has-variants">
                            Yes - This product comes in different options
                          </Label>
                        </div>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Variant Attributes */}
              {watchedHasVariants && (
                <div className="space-y-4">
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      Select the attributes that define different variants of
                      this product. For example, if you sell t-shirts in
                      different colors and sizes, select both "Color" and
                      "Size".
                    </AlertDescription>
                  </Alert>

                  <FormField
                    control={control}
                    name="variantDefiningAttributes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Variant Attributes</FormLabel>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                          {VARIANT_ATTRIBUTES.map((attr) => (
                            <div
                              key={attr.id}
                              className="flex items-center space-x-2"
                            >
                              <Checkbox
                                id={attr.id}
                                checked={field.value?.includes(attr.id)}
                                onCheckedChange={(checked) => {
                                  const current = field.value || [];
                                  if (checked) {
                                    field.onChange([...current, attr.id]);
                                  } else {
                                    field.onChange(
                                      current.filter((id) => id !== attr.id)
                                    );
                                  }
                                }}
                              />
                              <Label
                                htmlFor={attr.id}
                                className="text-sm font-normal"
                              >
                                {attr.label}
                              </Label>
                            </div>
                          ))}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Product Features Card */}
          <Card>
            <CardHeader>
              <CardTitle>Product Features</CardTitle>
              <CardDescription>
                Highlight the key features and benefits of your product
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Highlights */}
              <div className="space-y-4">
                <Label>Product Highlights (Maximum 5)</Label>

                {/* Current highlights */}
                {watchedHighlights && watchedHighlights.length > 0 && (
                  <div className="space-y-2">
                    {watchedHighlights.map((highlight, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between bg-muted/50 rounded-md p-3 group"
                      >
                        <span className="text-sm flex-1">{highlight}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeHighlight(index)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add new highlight */}
                {(!watchedHighlights || watchedHighlights.length < 5) && (
                  <div className="flex gap-2">
                    <Input
                      value={newHighlight}
                      onChange={(e) => setNewHighlight(e.target.value)}
                      placeholder="e.g. Wireless connectivity, 20-hour battery life"
                      maxLength={150}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addHighlight();
                        }
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={addHighlight}
                      disabled={
                        !newHighlight.trim() || newHighlight.length > 150
                      }
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add
                    </Button>
                  </div>
                )}

                <p className="text-xs text-muted-foreground">
                  {newHighlight.length}/150 characters
                </p>

                <FormField
                  control={control}
                  name="highlights"
                  render={() => <FormMessage />}
                />
              </div>
            </CardContent>
          </Card>

          {/* Technical Specifications */}
          <Collapsible open={specsExpanded} onOpenChange={setSpecsExpanded}>
            <Card>
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Technical Specifications</CardTitle>
                      <CardDescription>
                        Add detailed technical specifications for your product
                      </CardDescription>
                    </div>
                    {specsExpanded ? (
                      <ChevronDown className="h-5 w-5" />
                    ) : (
                      <ChevronRight className="h-5 w-5" />
                    )}
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent>
                  <FormField
                    control={control}
                    name="specifications"
                    render={({ field }) => (
                      <FormItem>
                        <SpecificationInput
                          value={field.value}
                          onChange={field.onChange}
                          categoryId={watchedLeafCategoryId}
                        />
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          {/* Form Actions */}
          <div className="flex items-center justify-between pt-6 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onPrevious}
              disabled={isSubmitting}
            >
              Previous
            </Button>

            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Save and Continue
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
