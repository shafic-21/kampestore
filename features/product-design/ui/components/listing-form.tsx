"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useDebounce } from "@/hooks/use-debounce";
import { useProductDesignStore } from "../../store";

const listingFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
});

type ListingFormData = z.infer<typeof listingFormSchema>;

interface ListingFormProps {
  onBack?: () => void;
}

export function ListingForm({ onBack }: ListingFormProps) {
  const updateListingDetails = useProductDesignStore((state) => state.updateListingDetails);
  const title = useProductDesignStore((state) => state.listing.title);
  const description = useProductDesignStore((state) => state.listing.description);

  const form = useForm<ListingFormData>({
    resolver: zodResolver(listingFormSchema),
    defaultValues: {
      title: title || "",
      description: description || "",
    },
  });

  const formTitle = form.watch("title");
  const formDescription = form.watch("description");

  const debouncedTitle = useDebounce(formTitle, 500);
  const debouncedDescription = useDebounce(formDescription, 500);

  useEffect(() => {
    if (debouncedTitle !== undefined) {
      if (!debouncedTitle) {
        form.setError("title", { message: "Title is required" });
      } else {
        form.clearErrors("title");
        updateListingDetails(debouncedTitle, debouncedDescription);
      }
    }
  }, [debouncedTitle, debouncedDescription, updateListingDetails, form]);

  const onSubmit = (data: ListingFormData) => {
    console.log("Form data:", data);
  };

  return (
    <div className="w-full">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Title</FormLabel>
                <FormControl>
                  <Input placeholder="Enter listing title" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Describe your listing (optional)"
                    className="min-h-[120px]"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </form>
      </Form>
    </div>
  );
}
