import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Edit, Trash2, Package } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { toast } from "sonner";
import { itemAPI, getCompanyData } from "@/lib/api";
import type { Item } from "@/lib/types";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const Items = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [items, setItems] = useState<Item[]>([]);
  const [itemThumbnails, setItemThumbnails] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const company = getCompanyData();

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    try {
      setLoading(true);
      const data: any = await itemAPI.getList();
      setItems(data);
      
      // Load thumbnails for all items
      const thumbnails: Record<number, string> = {};
      for (const item of data) {
        try {
          const url = await itemAPI.getPictureThumbnailUrl(item.itemID);
          if (url) thumbnails[item.itemID] = url;
        } catch (e) {
          // Thumbnail not available
        }
      }
      setItemThumbnails(thumbnails);
    } catch (error: any) {
      toast.error(error.message || "Failed to load items");
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = items.filter(item =>
    item.itemName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const confirmDelete = async () => {
    if (!deleteId) return;
    
    try {
      await itemAPI.delete(deleteId);
      toast.success("Item deleted successfully");
      setItems(items.filter(item => item.itemID !== deleteId));
      setDeleteId(null);
    } catch (error: any) {
      toast.error(error.message || "Failed to delete item");
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Item Master</h1>
            <p className="text-muted-foreground">Manage your product and service catalog</p>
          </div>
          <Button onClick={() => navigate("/items/new")} size="lg">
            <Plus className="h-4 w-4 mr-2" />
            Add Item
          </Button>
        </div>

        <Card className="shadow-card">
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search items..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Loading items...</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[80px]">Picture</TableHead>
                    <TableHead>Item Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Rate</TableHead>
                    <TableHead className="text-right">Discount</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredItems.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        {searchQuery ? "No items found matching your search." : "No items found. Create your first item to get started."}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredItems.map((item) => (
                      <TableRow key={item.itemID} className="hover:bg-muted/50">
                        <TableCell>
                          <Avatar className="h-12 w-12 rounded-md">
                            <AvatarImage src={itemThumbnails[item.itemID]} alt={item.itemName} />
                            <AvatarFallback className="rounded-md bg-muted">
                              <Package className="h-6 w-6 text-muted-foreground" />
                            </AvatarFallback>
                          </Avatar>
                        </TableCell>
                        <TableCell className="font-medium">{item.itemName}</TableCell>
                        <TableCell className="text-muted-foreground max-w-md truncate">{item.description || "-"}</TableCell>
                        <TableCell className="text-right">{company?.currencySymbol}{item.salesRate.toLocaleString()}</TableCell>
                        <TableCell className="text-right">
                          {item.discountPct > 0 ? (
                            <Badge variant="secondary">{item.discountPct}%</Badge>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => navigate(`/items/${item.itemID}`)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setDeleteId(item.itemID)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Item</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this item? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
};

export default Items;
