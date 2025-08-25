"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { X, PlusCircle, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

import { getCategoryAttributes } from "@/features/categories/actions/get-category-attributes";
import type { SpecificationItem } from "../store/use-catalog-creation-store";
// Assuming getCategoryAttributes is updated or a new action is created
// to fetch full AttributeDefinition objects for a category.
// import { getCategoryAttributes } from "@/features/categories/actions/get-category-attributes";

// --- Types ---

// Represents the full definition of an attribute, expected from the (mocked) API.
// In a real scenario, this would align with your `attributeDefinitions` table schema.
type AttributeDefinition = {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  dataType?: "string" | "number" | "boolean" | "enum" | null;
  allowedValues?: string[] | null;
  unit?: string | null;
  multiSelect?: boolean | null; // For enum type
};

interface SpecificationInputProps {
  value: SpecificationItem[]; // Current list of specifications
  onChange: (specifications: SpecificationItem[]) => void; // Callback to update parent state
  categoryId: string | null; // ID of the selected category to fetch relevant attributes
  disabled?: boolean;
  className?: string;
}

export function SpecificationInput({
  value = [],
  onChange,
  categoryId,
  disabled = false,
  className,
}: SpecificationInputProps) {
  // --- State ---
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [attributeSearchTerm, setAttributeSearchTerm] = useState("");
  const [selectedAttribute, setSelectedAttribute] =
    useState<AttributeDefinition | null>(null);

  // Holds the raw value being input for the selectedAttribute.
  // Type can vary (string, number, boolean, string[] for multi-select).
  const [currentInputValue, setCurrentInputValue] = useState<
    string | number | boolean | string[]
  >("");
  // Specific state for multi-select checkbox values.
  const [multiSelectCheckedItems, setMultiSelectCheckedItems] = useState<
    string[]
  >([]);

  const [availableAttributes, setAvailableAttributes] = useState<
    AttributeDefinition[]
  >([]);
  const [filteredAttributeList, setFilteredAttributeList] = useState<
    AttributeDefinition[]
  >([]);

  // --- Refs ---
  const attributeSearchInputRef = useRef<HTMLInputElement>(null);
  const popoverTriggerRef = useRef<HTMLButtonElement>(null); // Changed to Button for PopoverTrigger

  // --- Data Fetching ---
  // Fetches attribute definitions for the given categoryId.
  // IMPORTANT: This queryFn is a MOCK. Replace with your actual API call.
  // Your API should return AttributeDefinition[] based on the categoryId.
  // This might involve joining `categoryAttributes` with `attributeDefinitions` on the backend.
  const { data: fetchedCategoryAttributes, isLoading: isLoadingAttributes } =
    useQuery<AttributeDefinition[]>({
      queryKey: ["categorySpecificAttributes", categoryId],
      queryFn: async () => {
        if (!categoryId) return [];
        const response = await getCategoryAttributes(categoryId);
        console.log("fetchedCategoryAttributes", response);
        return response;
      },
      enabled: !!categoryId, // Only run query if categoryId is present
    });

  useEffect(() => {
    if (fetchedCategoryAttributes) {
      setAvailableAttributes(fetchedCategoryAttributes);
    }
  }, [fetchedCategoryAttributes]);

  // --- Effects ---
  // Filter available attributes for the dropdown based on search term and already added specs.
  useEffect(() => {
    const lowerCaseSearch = attributeSearchTerm.toLowerCase();
    const addedAttributeIds = new Set(value.map((spec) => spec.attributeId));

    const filtered = availableAttributes.filter(
      (attr) =>
        !addedAttributeIds.has(attr.id) &&
        (attr.name.toLowerCase().includes(lowerCaseSearch) ||
          attr.code.toLowerCase().includes(lowerCaseSearch))
    );
    setFilteredAttributeList(filtered);
  }, [attributeSearchTerm, availableAttributes, value]);

  // --- Handlers ---
  const handleAttributeSelect = useCallback(
    (attribute: AttributeDefinition) => {
      setSelectedAttribute(attribute);
      setAttributeSearchTerm(""); // Clear search input

      // Reset input value based on the new attribute's data type
      if (attribute.dataType === "boolean") {
        setCurrentInputValue(false); // Default boolean to false
      } else if (attribute.dataType === "enum" && attribute.multiSelect) {
        setMultiSelectCheckedItems([]); // Reset for multi-select
        setCurrentInputValue([]); // currentInputValue should be string[] for multi-select
      } else {
        setCurrentInputValue(""); // Default others to empty string
      }
      setPopoverOpen(false);
    },
    []
  );

  const handleAddSpecification = useCallback(() => {
    if (!selectedAttribute) return;

    let stringValue: string;
    let isValid = true;

    if (
      selectedAttribute.dataType === "enum" &&
      selectedAttribute.multiSelect
    ) {
      if (multiSelectCheckedItems.length === 0) {
        isValid = false;
        toast.error(
          `Please select at least one value for ${selectedAttribute.name}.`
        );
      }
      // Store as a JSON string array for `SpecificationItem.value: string`
      stringValue = JSON.stringify(multiSelectCheckedItems);
    } else if (selectedAttribute.dataType === "boolean") {
      // Store as "true" or "false" string
      stringValue = String(currentInputValue);
    } else if (
      typeof currentInputValue === "string" &&
      currentInputValue.trim() === ""
    ) {
      isValid = false;
      toast.error(`Value for ${selectedAttribute.name} cannot be empty.`);
      stringValue = ""; // Assign to satisfy type, though invalid
    } else if (
      typeof currentInputValue === "number" &&
      isNaN(currentInputValue)
    ) {
      isValid = false;
      toast.error(`Please enter a valid number for ${selectedAttribute.name}.`);
      stringValue = ""; // Assign to satisfy type, though invalid
    } else {
      // Store other types as their string representation
      stringValue = String(currentInputValue);
    }

    if (!isValid) return;

    const newSpec: SpecificationItem = {
      attributeId: selectedAttribute.id,
      attributeCode: selectedAttribute.code,
      attributeName: selectedAttribute.name,
      value: stringValue,
      unit: selectedAttribute.unit || null,
    };

    onChange([...value, newSpec]);

    // Reset state for adding next specification
    setSelectedAttribute(null);
    setCurrentInputValue("");
    setMultiSelectCheckedItems([]);
    if (popoverTriggerRef.current) {
      popoverTriggerRef.current.focus();
    }
  }, [
    selectedAttribute,
    currentInputValue,
    multiSelectCheckedItems,
    value,
    onChange,
  ]);

  const handleRemoveSpecification = useCallback(
    (indexToRemove: number) => {
      onChange(value.filter((_, index) => index !== indexToRemove));
    },
    [value, onChange]
  );

  const handleMultiSelectCheckboxChange = useCallback(
    (itemValue: string, checked: boolean) => {
      const newCheckedItems = checked
        ? [...multiSelectCheckedItems, itemValue]
        : multiSelectCheckedItems.filter((v) => v !== itemValue);
      setMultiSelectCheckedItems(newCheckedItems);
      setCurrentInputValue(newCheckedItems); // Keep currentInputValue in sync
    },
    [multiSelectCheckedItems]
  );

  // --- Value Input Renderer ---
  const renderValueInput = () => {
    if (!selectedAttribute) return null;

    const inputId = `spec-value-input-${selectedAttribute.code}`;

    switch (selectedAttribute.dataType) {
      case "enum":
        if (
          !selectedAttribute.allowedValues ||
          selectedAttribute.allowedValues.length === 0
        ) {
          return (
            <p className="text-sm text-muted-foreground">
              No predefined values for this attribute.
            </p>
          );
        }
        if (selectedAttribute.multiSelect) {
          return (
            <div className="space-y-2">
              <Label htmlFor={inputId} className="text-sm sr-only">
                Select values for {selectedAttribute.name}
              </Label>
              <div
                id={inputId}
                className="border rounded-md p-3 space-y-2 max-h-48 overflow-y-auto"
              >
                {selectedAttribute.allowedValues.map((val) => (
                  <div key={val} className="flex items-center space-x-2">
                    <Checkbox
                      id={`${inputId}-${val}`}
                      checked={multiSelectCheckedItems.includes(val)}
                      onCheckedChange={(checked) =>
                        handleMultiSelectCheckboxChange(val, Boolean(checked))
                      }
                      disabled={disabled}
                    />
                    <Label
                      htmlFor={`${inputId}-${val}`}
                      className="text-sm font-normal cursor-pointer"
                    >
                      {val}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          );
        }
        // Single-select enum
        return (
          <Select
            value={
              typeof currentInputValue === "string" ? currentInputValue : ""
            }
            onValueChange={(val) => setCurrentInputValue(val)}
            disabled={disabled}
          >
            <SelectTrigger id={inputId} className="w-full">
              <SelectValue
                placeholder={`Select ${selectedAttribute.name.toLowerCase()}`}
              />
            </SelectTrigger>
            <SelectContent>
              {selectedAttribute.allowedValues.map((val) => (
                <SelectItem key={val} value={val}>
                  {val}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      case "boolean":
        return (
          <Select
            value={
              currentInputValue === true
                ? "true"
                : currentInputValue === false
                ? "false"
                : ""
            }
            onValueChange={(val) => setCurrentInputValue(val === "true")}
            disabled={disabled}
          >
            <SelectTrigger id={inputId} className="w-full">
              <SelectValue
                placeholder={`Select ${selectedAttribute.name.toLowerCase()}`}
              />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="true">Yes</SelectItem>
              <SelectItem value="false">No</SelectItem>
            </SelectContent>
          </Select>
        );
      case "number":
        return (
          <div className="flex items-center gap-2 w-full">
            <Input
              id={inputId}
              type="number"
              value={
                typeof currentInputValue === "number" ||
                currentInputValue === ""
                  ? currentInputValue
                  : ""
              }
              onChange={(e) =>
                setCurrentInputValue(
                  e.target.value === "" ? "" : parseFloat(e.target.value)
                )
              }
              placeholder={`Enter ${selectedAttribute.name.toLowerCase()}`}
              className="flex-1"
              disabled={disabled}
              step="any" // Allow decimal inputs
            />
            {selectedAttribute.unit && (
              <span className="text-sm text-muted-foreground whitespace-nowrap">
                {selectedAttribute.unit}
              </span>
            )}
          </div>
        );
      case "string":
      default:
        return (
          <div className="flex items-center gap-2 w-full">
            <Input
              id={inputId}
              type="text"
              value={
                typeof currentInputValue === "string" ? currentInputValue : ""
              }
              onChange={(e) => setCurrentInputValue(e.target.value)}
              placeholder={`Enter ${selectedAttribute.name.toLowerCase()}`}
              className="flex-1"
              disabled={disabled}
            />
            {selectedAttribute.unit && (
              <span className="text-sm text-muted-foreground whitespace-nowrap">
                {selectedAttribute.unit}
              </span>
            )}
          </div>
        );
    }
  };

  // --- Display Value Formatter ---
  const formatDisplayValue = (spec: SpecificationItem): string => {
    const attribute = availableAttributes.find(
      (attr) => attr.id === spec.attributeId
    );
    if (attribute?.dataType === "enum" && attribute.multiSelect) {
      try {
        // Value is stored as a JSON stringified array
        const parsedArray = JSON.parse(spec.value);
        return Array.isArray(parsedArray) ? parsedArray.join(", ") : spec.value;
      } catch (e) {
        return spec.value; // Fallback if parsing fails
      }
    }
    if (attribute?.dataType === "boolean") {
      return spec.value === "true"
        ? "Yes"
        : spec.value === "false"
        ? "No"
        : spec.value;
    }
    return spec.value;
  };

  // --- Render ---
  if (isLoadingAttributes && !availableAttributes.length && categoryId) {
    return (
      <div className={cn("space-y-4", className)}>
        <Skeleton className="h-8 w-1/3 mb-3" />{" "}
        {/* Label for "Add Specification" */}
        <Skeleton className="h-10 w-full mb-4" /> {/* Popover Trigger */}
        {/* Skeleton for a few added items */}
        <Skeleton className="h-12 w-full mb-2" />
        <Skeleton className="h-12 w-full" />
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Display selected specifications */}
      {value.length > 0 && (
        <div className="space-y-3">
          <Label>Current Specifications</Label>
          {value.map((spec, index) => (
            <div
              key={`${spec.attributeId}-${index}`} // More stable key if attributeId can repeat (though it shouldn't in `value`)
              className="flex items-center gap-3 bg-muted/10 dark:bg-muted/20 rounded-md p-3 group"
            >
              <div className="w-1/3 truncate">
                <Badge variant="outline" className="font-normal text-sm">
                  {spec.attributeName}
                </Badge>
              </div>
              <div className="flex-1 flex items-center gap-2 text-sm">
                <span className="truncate">{formatDisplayValue(spec)}</span>
                {spec.unit && (
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {spec.unit}
                  </span>
                )}
              </div>
              {!disabled && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemoveSpecification(index)}
                  className="h-7 w-7 opacity-50 group-hover:opacity-100 transition-opacity"
                  aria-label={`Remove ${spec.attributeName} specification`}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add new specification section */}
      {!disabled && availableAttributes.length > value.length && (
        <div className="space-y-3 pt-2">
          <Label htmlFor="attribute-search-input">Add New Specification</Label>
          {selectedAttribute ? (
            // --- Value input mode ---
            <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] gap-3 items-end">
              <div>
                <Label
                  htmlFor={`spec-attr-display-${selectedAttribute.code}`}
                  className="text-sm mb-1.5 block font-medium"
                >
                  Attribute
                </Label>
                <div
                  id={`spec-attr-display-${selectedAttribute.code}`}
                  className="flex items-center h-10 px-3 rounded-md border border-input bg-muted/50 text-sm"
                >
                  {selectedAttribute.name}
                </div>
              </div>
              <div>
                <Label
                  htmlFor={`spec-value-input-${selectedAttribute.code}`}
                  className="text-sm mb-1.5 block font-medium"
                >
                  Value
                </Label>
                {renderValueInput()}
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  onClick={handleAddSpecification}
                  size="sm"
                >
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Add
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedAttribute(null)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            // --- Attribute selection mode ---
            <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
              <PopoverTrigger asChild>
                <Button
                  ref={popoverTriggerRef}
                  variant="outline"
                  role="combobox"
                  aria-expanded={popoverOpen}
                  className="w-full justify-start text-muted-foreground hover:text-foreground"
                  disabled={disabled || !categoryId || isLoadingAttributes}
                  id="attribute-search-input"
                >
                  {isLoadingAttributes ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <PlusCircle className="mr-2 h-4 w-4" />
                  )}
                  {isLoadingAttributes
                    ? "Loading attributes..."
                    : "Select an attribute to add..."}
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className="p-0 w-[--radix-popover-trigger-width]"
                align="start"
                onOpenAutoFocus={(e) => {
                  e.preventDefault();
                  attributeSearchInputRef.current?.focus();
                }}
              >
                <Command>
                  <Input
                    ref={attributeSearchInputRef}
                    placeholder="Search attributes..."
                    value={attributeSearchTerm}
                    onChange={(e) => setAttributeSearchTerm(e.target.value)}
                    className="h-9 rounded-b-none border-x-0 border-t-0 focus-visible:ring-0"
                  />
                  <CommandList>
                    {filteredAttributeList.length === 0 &&
                      !isLoadingAttributes && (
                        <CommandEmpty>No attributes found.</CommandEmpty>
                      )}
                    {isLoadingAttributes && (
                      <CommandItem
                        disabled
                        className="flex justify-center py-2"
                      >
                        <Loader2 className="h-4 w-4 animate-spin" />
                      </CommandItem>
                    )}
                    {!isLoadingAttributes && (
                      <CommandGroup>
                        {filteredAttributeList.map((attribute) => (
                          <CommandItem
                            key={attribute.id}
                            value={attribute.name} // Value for CMDK filtering/selection
                            onSelect={() => handleAttributeSelect(attribute)}
                            className="text-sm"
                          >
                            {attribute.name}
                            <span className="ml-2 text-xs text-muted-foreground">
                              ({attribute.code})
                            </span>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    )}
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          )}
        </div>
      )}

      {/* Informational messages */}
      {!disabled &&
        availableAttributes.length > 0 &&
        availableAttributes.length === value.length && (
          <p className="text-sm text-muted-foreground italic pt-2">
            All available specifications for this category have been added.
          </p>
        )}
      {!disabled &&
        !isLoadingAttributes &&
        categoryId &&
        availableAttributes.length === 0 && (
          <p className="text-sm text-muted-foreground italic pt-2">
            No specifications defined for this category.
          </p>
        )}
      {!categoryId && !disabled && (
        <p className="text-sm text-muted-foreground italic pt-2">
          Please select a category to see available specifications.
        </p>
      )}
    </div>
  );
}
