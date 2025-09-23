"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface ProductAccordionProps {
  listingDescription?: string | null;
  productDetails?: string | null;
  className?: string;
}

export function ProductAccordion({
  listingDescription,
  productDetails,
  className,
}: ProductAccordionProps) {
  // Create accordion items based on available content
  const accordionItems = [];

  if (listingDescription) {
    accordionItems.push({
      value: "description",
      title: "Description",
      content: listingDescription,
    });
  }

  // Always show product details (even if placeholder)
  accordionItems.push({
    value: "details",
    title: "Product Details",
    content: productDetails || "High-quality print-on-demand product. Specific details coming soon.",
  });

  // Add shipping & returns info
  accordionItems.push({
    value: "shipping",
    title: "Shipping & Returns",
    content: `
      <div class="space-y-3">
        <div>
          <h4 class="font-medium mb-1">Shipping</h4>
          <p class="text-sm text-gray-600">
            Free shipping on orders over UGX 100,000. Standard delivery takes 5-7 business days.
          </p>
        </div>
        <div>
          <h4 class="font-medium mb-1">Returns</h4>
          <p class="text-sm text-gray-600">
            30-day return policy. Items must be in original condition with tags attached.
          </p>
        </div>
      </div>
    `,
  });

  if (accordionItems.length === 0) {
    return null;
  }

  return (
    <div className={className}>
      <Accordion type="multiple" className="w-full">
        {accordionItems.map((item) => (
          <AccordionItem key={item.value} value={item.value}>
            <AccordionTrigger className="text-left font-medium">
              {item.title}
            </AccordionTrigger>
            <AccordionContent className="text-gray-600">
              <div
                dangerouslySetInnerHTML={{ __html: item.content }}
                className="prose prose-sm max-w-none"
              />
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}