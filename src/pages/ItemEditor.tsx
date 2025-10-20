import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useFormik } from "formik";
import * as Yup from "yup";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Upload, X } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { toast } from "sonner";
import { itemAPI, getCompanyData } from "@/lib/api";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

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

const ItemEditor = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = id !== "new";
  const company = getCompanyData();
  const currencySymbol = company?.currencySymbol || "₹";
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(false);
  const [updatedOn, setUpdatedOn] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null);

  const formik = useFormik({
    initialValues: {
      itemName: "",
      description: "",
      salesRate: 0,
      discountPct: 0,
    },
    validationSchema: itemSchema,
    onSubmit: async (values) => {
      try {
        setLoading(true);
        let itemId: number;

        if (isEditMode && id) {
          await itemAPI.update({
            itemID: parseInt(id),
            ...values,
            description: values.description || null,
            updatedOn,
          });
          itemId = parseInt(id);
          toast.success("Item updated successfully");
        } else {
          const result: any = await itemAPI.create({
            ...values,
            description: values.description || null,
          });
          itemId = result.primaryKeyID;
          toast.success("Item created successfully");
        }

        // Upload image if selected
        if (imageFile && itemId) {
          try {
            await itemAPI.updatePicture(itemId, imageFile);
            toast.success("Image uploaded successfully");
          } catch (error) {
            toast.error("Item saved but image upload failed");
          }
        }

        navigate("/items");
      } catch (error: any) {
        toast.error(error.message || "Failed to save item");
      } finally {
        setLoading(false);
      }
    },
  });

  useEffect(() => {
    if (isEditMode && id) {
      loadItem();
    }
  }, [id]);

  const loadItem = async () => {
    if (!id || id === "new") return;
    
    try {
      setLoading(true);
      const data: any = await itemAPI.getById(parseInt(id));
      formik.setValues({
        itemName: data.itemName,
        description: data.description || "",
        salesRate: data.salesRate,
        discountPct: data.discountPct,
      });
      setUpdatedOn(data.updatedOn);
      
      // Load existing image
      try {
        const imageUrl = await itemAPI.getPictureUrl(parseInt(id));
        if (imageUrl) setExistingImageUrl(imageUrl);
      } catch (e) {
        // No image available
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to load item");
      navigate("/items");
    } finally {
      setLoading(false);
    }
  };

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
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  if (loading && isEditMode) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <p className="text-muted-foreground">Loading item...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <form onSubmit={formik.handleSubmit} className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => navigate("/items")}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">
                {isEditMode ? "Edit Item" : "New Item"}
              </h1>
              <p className="text-muted-foreground">
                {isEditMode ? "Update item details" : "Add a new product or service to your catalog"}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/items")}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Save Item"}
            </Button>
          </div>
        </div>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Item Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
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

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                {...formik.getFieldProps("description")}
                placeholder="Enter item description"
                rows={4}
              />
              <p className="text-sm text-muted-foreground text-right">
                {formik.values.description.length}/500
              </p>
              {formik.touched.description && formik.errors.description && (
                <p className="text-sm text-destructive">{formik.errors.description}</p>
              )}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
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

            <div className="space-y-2">
              <Label>Item Picture</Label>
              <div className="flex items-center gap-4">
                {(imagePreview || existingImageUrl) && (
                  <div className="relative">
                    <Avatar className="h-24 w-24 rounded-md">
                      <AvatarImage src={imagePreview || existingImageUrl || ''} alt="Item preview" />
                      <AvatarFallback className="rounded-md">IMG</AvatarFallback>
                    </Avatar>
                    {imagePreview && (
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
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    {imagePreview ? 'Change Image' : 'Upload Image'}
                  </Button>
                  <p className="text-xs text-muted-foreground mt-2">
                    PNG or JPG, max 5MB
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </form>
    </DashboardLayout>
  );
};

export default ItemEditor;
