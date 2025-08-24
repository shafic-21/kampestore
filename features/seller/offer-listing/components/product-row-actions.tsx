"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { MoreVertical } from "lucide-react"
import type { Product } from "@/features/seller/types"

export function ProductRowActions({ product }: { product: Product }) {
  const [alertOpen, setAlertOpen] = useState(false)

  const isDraft = product.status === "Draft"
  const isPendingApproval = product.status === "Pending Approval"
  const isActive = product.status === "Live" || product.status === "Out of Stock"
  const isVisible = product.isVisible === true

  const handleDelete = () => {
    setAlertOpen(true)
  }

  const confirmDelete = () => {
    // In a real app, this would call an API to delete the product
    console.log(`Confirmed delete for product ${product.id}`)
    setAlertOpen(false)
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <MoreVertical className="h-4 w-4" />
            <span className="sr-only">Open menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem>Edit</DropdownMenuItem>
          <DropdownMenuItem>Manage inventory</DropdownMenuItem>
          <DropdownMenuSeparator />

          {isVisible ? (
            <DropdownMenuItem>Hide from store</DropdownMenuItem>
          ) : (
            <DropdownMenuItem>Show in store</DropdownMenuItem>
          )}

          <DropdownMenuItem>Duplicate</DropdownMenuItem>

          {isActive ? <DropdownMenuItem>Deactivate</DropdownMenuItem> : <DropdownMenuItem>Renew</DropdownMenuItem>}

          <DropdownMenuSeparator />
          <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={handleDelete}>
            Delete...
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={alertOpen} onOpenChange={setAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Product</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this product? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
