import { useEffect, useRef } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Upload, X } from "lucide-react";
import { toast } from "sonner";
import { itemAPI, getCompanyData } from "@/lib/api";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { Item } from "@/lib/types";

const itemSchema = Yup.object().shape({
  itemName: Yup.string()
    .trim()
    .required("Item name is required")
    .max(50, "Item name must be less than 50 characters"),
  description: Yup.string()
    .trim()
    .max(500, "Description must be less than 500 characters"),
  salesRate: Yup.number()
    .required("Sales rate is required")
    .min(0, "Sales rate must be 0 or greater")
    .typeError("Sales rate must be a number"),
  discountPct: Yup.number()
    .min(0, "Discount must be 0 or greater")
    .max(100, "Discount must be 100 or less")
    .typeError("Discount must be a number"),
});

interface ItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item?: Item;
  onSuccess: () => void;
}

export const ItemDialog = ({ open, onOpenChange, item, onSuccess }: ItemDialogProps) => {
  const company = getCompanyData();
  const currencySymbol = company?.currencySymbol || "₹";
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formik = useFormik({
    initialValues: {
      itemName: "",
      description: "",
      salesRate: 0,
      discountPct: 0,
      imageFile: null as File | null,
      imagePreview: null as string | null,
      existingImageUrl: null as string | null,
    },
    validationSchema: itemSchema,
    onSubmit: async (values) => {
      try {
        let itemId: number;

        if (item) {
          await itemAPI.update({
            itemID: item.itemID,
            itemName: values.itemName,
            description: values.description || null,
            salesRate: values.salesRate,
            discountPct: values.discountPct,
            updatedOn: item.updatedOn,
          });
          itemId = item.itemID;
          toast.success("Item updated successfully");
        } else {
          const result: any = await itemAPI.create({
            itemName: values.itemName,
            description: values.description || null,
            salesRate: values.salesRate,
            discountPct: values.discountPct,
          });
          itemId = result.primaryKeyID;
          toast.success("Item created successfully");
        }

        // Upload image if selected
        if (values.imageFile && itemId) {
          try {
            await itemAPI.updatePicture(itemId, values.imageFile);
            toast.success("Image uploaded successfully");
          } catch (error) {
            toast.error("Item saved but image upload failed");
          }
        }

        onSuccess();
        onOpenChange(false);
        formik.resetForm();
      } catch (error: any) {
        toast.error(error.message || "Failed to save item");
      }
    },
  });

  useEffect(() => {
    if (open && item) {
      formik.setValues({
        itemName: item.itemName,
        description: item.description || "",
        salesRate: item.salesRate,
        discountPct: item.discountPct,
        imageFile: null,
        imagePreview: null,
        existingImageUrl: null,
      });
      
      // Load existing image
      itemAPI.getPictureUrl(item.itemID).then(url => {
        if (url) formik.setFieldValue('existingImageUrl', url);
      }).catch(() => {});
    } else if (!open) {
      formik.resetForm();
    }
  }, [open, item]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error("Please select an image file");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image size must be less than 5MB");
        return;
      }
      formik.setFieldValue('imageFile', file);
      formik.setFieldValue('imagePreview', URL.createObjectURL(file));
    }
  };

  const handleRemoveImage = () => {
    formik.setFieldValue('imageFile', null);
    formik.setFieldValue('imagePreview', null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{item ? "Edit Item" : "New Item"}</DialogTitle>
          <DialogDescription>
            {item ? "Update item details" : "Add a new product or service to your catalog"}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={formik.handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Item Picture</Label>
            <div className="flex items-center gap-4">
              {(formik.values.imagePreview || formik.values.existingImageUrl) && (
                <div className="relative">
                  <Avatar className="h-20 w-20 rounded-md">
                    <AvatarImage 
                      src={formik.values.imagePreview || formik.values.existingImageUrl || ''} 
                      alt="Item preview" 
                    />
                    <AvatarFallback className="rounded-md">IMG</AvatarFallback>
                  </Avatar>
                  {formik.values.imagePreview && (
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute -top-2 -right-2 h-6 w-6"
                      onClick={handleRemoveImage}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              )}
              <div>
                <Input
                  ref={fileInputRef}
                  id="picture"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {formik.values.imagePreview ? 'Change' : 'Upload'}
                </Button>
                <p className="text-xs text-muted-foreground mt-1">
                  PNG or JPG, max 5MB
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="itemName">Item Name *</Label>
              <Input
                id="itemName"
                {...formik.getFieldProps("itemName")}
                placeholder="Enter item name"
              />
              {formik.touched.itemName && formik.errors.itemName && (
                <p className="text-sm text-destructive">{formik.errors.itemName}</p>
              )}
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                {...formik.getFieldProps("description")}
                placeholder="Enter item description"
                rows={3}
              />
              <p className="text-sm text-muted-foreground text-right">
                {formik.values.description.length}/500
              </p>
              {formik.touched.description && formik.errors.description && (
                <p className="text-sm text-destructive">{formik.errors.description}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="salesRate">Sales Rate * ({currencySymbol})</Label>
              <Input
                id="salesRate"
                type="number"
                step="0.01"
                {...formik.getFieldProps("salesRate")}
                placeholder="0.00"
              />
              {formik.touched.salesRate && formik.errors.salesRate && (
                <p className="text-sm text-destructive">{formik.errors.salesRate}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="discountPct">Discount (%)</Label>
              <Input
                id="discountPct"
                type="number"
                step="0.01"
                {...formik.getFieldProps("discountPct")}
                placeholder="0.00"
              />
              {formik.touched.discountPct && formik.errors.discountPct && (
                <p className="text-sm text-destructive">{formik.errors.discountPct}</p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit">
              Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
