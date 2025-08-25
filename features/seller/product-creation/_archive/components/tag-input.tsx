"use client";

import type React from "react";
import { useState, useRef, type KeyboardEvent, useEffect } from "react";
import { X, TagIcon } from "lucide-react";

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
import { cn } from "@/lib/utils";

interface TagInputProps {
  value?: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
  maxTags?: number;
  maxLength?: number;
  suggestions?: string[];
  className?: string;
}

export function TagInput({
  value = [],
  onChange,
  placeholder = "Add tags...",
  disabled = false,
  maxTags = 10,
  maxLength = 30,
  className,
}: TagInputProps) {
  // State
  const [inputValue, setInputValue] = useState("");
  const [open, setOpen] = useState(false);
 
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    const shouldOpen = !!newValue;
    
    setOpen(shouldOpen);
  };

  // Add tag handler (with validation)
  const addTag = (tag: string) => {
    const trimmedTag = tag.trim();
    if (!trimmedTag) return;
    if (trimmedTag.length > maxLength) {
      console.warn(`Tag "${trimmedTag}" exceeds max length of ${maxLength}`);
      return;
    }
    if (value.includes(trimmedTag)) {
      console.warn(`Tag "${trimmedTag}" already exists.`);
      setInputValue(""); // Clear input on duplicate attempt
      return;
    }
    if (value.length >= maxTags) {
      console.warn(`Maximum number of tags (${maxTags}) reached.`);
      return;
    }
    onChange([...value, trimmedTag]);
    setInputValue("");
    setOpen(false);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  // Remove tag handler
  const removeTag = (tagToRemove: string) => {
    onChange(value.filter((tag) => tag !== tagToRemove));
  };

  // Keyboard handler for input
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (
      (e.key === "Enter" || e.key === "Tab" || e.key === ",") &&
      inputValue.trim()
    ) {
      e.preventDefault();
      addTag(inputValue);
    }
    if (e.key === "Backspace" && !inputValue && value.length > 0) {
      removeTag(value[value.length - 1]);
    }
  };

  // Suggestion selection handler
  const handleSelectSuggestion = (selectedTag: string) => {
    addTag(selectedTag);
  };

  // Focus input on container click
  const focusInput = () => {
    if (!disabled) {
      inputRef.current?.focus();
    }
  };

  const trimmedInputValue = inputValue.trim();

  const showCreateOption =
    trimmedInputValue &&
    !value.includes(trimmedInputValue) &&
  
    trimmedInputValue.length > 0 &&
    trimmedInputValue.length <= maxLength &&
    value.length < maxTags;

  return (
    <div
      ref={containerRef}
      className={cn(
        "flex flex-wrap gap-2 p-2 border rounded-md bg-background min-h-10 items-center",
        "focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2",
        disabled ? "opacity-50 cursor-not-allowed" : "cursor-text",
        className
      )}
      onClick={focusInput}
    >
      {/* Render tags */}
      {value.map((tag) => (
        <Badge
          key={tag}
          variant="secondary"
          className="gap-1 text-sm py-1 px-2 h-7 whitespace-nowrap"
        >
          {tag}
          {!disabled && (
            <button
              type="button"
              aria-label={`Remove ${tag} tag`}
              onClick={(e) => {
                e.stopPropagation();
                removeTag(tag);
              }}
              className="ml-1 rounded-full hover:bg-background/60 p-0.5 focus:outline-none focus:ring-1 focus:ring-ring focus:ring-offset-1"
            >
              <X className="h-3 w-3" />
              <span className="sr-only">Remove {tag} tag</span>
            </button>
          )}
        </Badge>
      ))}

      {/* Render input area */}
      {value.length < maxTags && !disabled && (
        <div className="flex-grow flex items-center min-w-[120px] self-stretch">
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <div className="flex-1 flex items-center h-full">
                <TagIcon className="h-4 w-4 text-muted-foreground mr-2 flex-shrink-0" />
                <input
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  placeholder={value.length === 0 ? placeholder : ""}
                  className="flex-1 bg-transparent border-none outline-none placeholder:text-muted-foreground text-sm p-0 h-full"
                  disabled={disabled}
                  onFocus={() => {
                    const shouldOpen = !!inputValue;
               
                    setOpen(shouldOpen);
                  }}
                />
              </div>
            </PopoverTrigger>

          
            <PopoverContent
            
              className="p-0 w-[--radix-popover-trigger-width]"
              align="start"
              onOpenAutoFocus={(e) => e.preventDefault()}
            >
              <Command>
                {/* CommandList will handle its own scrolling if needed */}
                <CommandList>
                  <CommandGroup>
                    {/* "Add tag" option */}
                    {showCreateOption && (
                      <CommandItem
                        key={`create-${trimmedInputValue}`}
                        value={`create-${trimmedInputValue}`}
                        onSelect={() => addTag(trimmedInputValue)}
                        className="cursor-pointer italic text-muted-foreground text-xs"
                      >
                        Add tag: "{trimmedInputValue}"
                      </CommandItem>
                    )}
                
                  </CommandGroup>
             
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>
      )}

      {/* Max tags message */}
      {value.length >= maxTags && !disabled && (
        <span className="text-xs text-muted-foreground ml-2 self-center">
          Maximum {maxTags} tags reached
        </span>
      )}
    </div>
  );
}
