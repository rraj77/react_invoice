import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Package,
  Download,
  Settings2,
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import DashboardLayout from '@/components/DashboardLayout';
import { toast } from 'sonner';
import { itemAPI, getCompanyData } from '@/lib/api';
import type { Item } from '@/lib/types';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ItemDialog } from '@/components/ItemDialog';

const Items = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [items, setItems] = useState<Item[]>([]);
  const [itemThumbnails, setItemThumbnails] = useState<Record<number, string>>(
    {}
  );
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [itemDialogOpen, setItemDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | undefined>(undefined);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [visibleColumns, setVisibleColumns] = useState({
    picture: true,
    itemName: true,
    description: true,
    rate: true,
    discount: true,
  });
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
      toast.error(error.message || 'Failed to load items');
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = items.filter(
    (item) =>
      item.itemName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.description &&
        item.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const paginatedItems = filteredItems.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );
  const totalPages = Math.ceil(filteredItems.length / rowsPerPage);

  const handleEdit = (item: Item) => {
    setEditingItem(item);
    setItemDialogOpen(true);
  };

  const handleAddNew = () => {
    setEditingItem(undefined);
    setItemDialogOpen(true);
  };

  const handleDialogSuccess = () => {
    loadItems();
  };

  const handleExport = () => {
    const headers = ['Item Name', 'Description', 'Rate', 'Discount %'];
    const rows = filteredItems.map((item) => [
      item.itemName,
      item.description || '',
      item.salesRate.toString(),
      item.discountPct.toString(),
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `items-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Items exported successfully');
  };

  const confirmDelete = async () => {
    if (deleteId === null) return;

    try {
      await itemAPI.delete(deleteId);
      await loadItems();

      setDeleteId(null);
      toast.success('Item deleted successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete item');
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Items</h1>
            <p className="text-muted-foreground">
              Manage your product and service catalog.
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleAddNew} size="lg">
              <Plus className="h-4 w-4 mr-2" />
              Add New Item
            </Button>
            <Button onClick={handleExport} variant="outline" size="lg">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="lg">
                  <Settings2 className="h-4 w-4 mr-2" />
                  Columns
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 bg-background">
                <DropdownMenuCheckboxItem
                  checked={visibleColumns.picture}
                  onCheckedChange={(checked) =>
                    setVisibleColumns((prev) => ({ ...prev, picture: checked }))
                  }
                >
                  Picture
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={visibleColumns.itemName}
                  onCheckedChange={(checked) =>
                    setVisibleColumns((prev) => ({
                      ...prev,
                      itemName: checked,
                    }))
                  }
                >
                  Item Name
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={visibleColumns.description}
                  onCheckedChange={(checked) =>
                    setVisibleColumns((prev) => ({
                      ...prev,
                      description: checked,
                    }))
                  }
                >
                  Description
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={visibleColumns.rate}
                  onCheckedChange={(checked) =>
                    setVisibleColumns((prev) => ({ ...prev, rate: checked }))
                  }
                >
                  Sale Rate
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={visibleColumns.discount}
                  onCheckedChange={(checked) =>
                    setVisibleColumns((prev) => ({
                      ...prev,
                      discount: checked,
                    }))
                  }
                >
                  Discount
                </DropdownMenuCheckboxItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
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
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      {visibleColumns.picture && (
                        <TableHead className="w-[80px]">Picture</TableHead>
                      )}
                      {visibleColumns.itemName && (
                        <TableHead>Item Name</TableHead>
                      )}
                      {visibleColumns.description && (
                        <TableHead>Description</TableHead>
                      )}
                      {visibleColumns.rate && (
                        <TableHead className="text-right">Sale Rate</TableHead>
                      )}
                      {visibleColumns.discount && (
                        <TableHead className="text-right">Discount %</TableHead>
                      )}
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedItems.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={6}
                          className="text-center py-8 text-muted-foreground"
                        >
                          {searchQuery
                            ? 'No items found matching your search.'
                            : 'No items found. Create your first item to get started.'}
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedItems.map((item) => (
                        <TableRow
                          key={item.itemID}
                          className="hover:bg-muted/50"
                        >
                          {visibleColumns.picture && (
                            <TableCell>
                              <Avatar className="h-12 w-12 rounded-md">
                                <AvatarImage
                                  src={itemThumbnails[item.itemID]}
                                  alt={item.itemName}
                                />
                                <AvatarFallback className="rounded-md bg-muted">
                                  <Package className="h-6 w-6 text-muted-foreground" />
                                </AvatarFallback>
                              </Avatar>
                            </TableCell>
                          )}
                          {visibleColumns.itemName && (
                            <TableCell className="font-medium">
                              {item.itemName}
                            </TableCell>
                          )}
                          {visibleColumns.description && (
                            <TableCell className="text-muted-foreground max-w-md truncate">
                              {item.description || '-'}
                            </TableCell>
                          )}
                          {visibleColumns.rate && (
                            <TableCell className="text-right">
                              {company?.currencySymbol}
                              {item.salesRate.toLocaleString()}
                            </TableCell>
                          )}
                          {visibleColumns.discount && (
                            <TableCell className="text-right">
                              {item.discountPct > 0 ? (
                                <Badge variant="secondary">
                                  {item.discountPct}%
                                </Badge>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </TableCell>
                          )}
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEdit(item)}
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

                {/* Pagination */}
                {filteredItems.length > 0 && (
                  <div className="flex items-center justify-between mt-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        Rows per page:
                      </span>
                      <Select
                        value={rowsPerPage.toString()}
                        onValueChange={(value) => {
                          setRowsPerPage(parseInt(value));
                          setPage(0);
                        }}
                      >
                        <SelectTrigger className="w-[70px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="10">10</SelectItem>
                          <SelectItem value="25">25</SelectItem>
                          <SelectItem value="50">50</SelectItem>
                          <SelectItem value="100">100</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        {page * rowsPerPage + 1}-
                        {Math.min(
                          (page + 1) * rowsPerPage,
                          filteredItems.length
                        )}{' '}
                        of {filteredItems.length}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(Math.max(0, page - 1))}
                        disabled={page === 0}
                      >
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setPage(Math.min(totalPages - 1, page + 1))
                        }
                        disabled={page >= totalPages - 1}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <ItemDialog
        open={itemDialogOpen}
        onOpenChange={setItemDialogOpen}
        item={editingItem}
        onSuccess={handleDialogSuccess}
      />

      <AlertDialog
        open={deleteId !== null}
        onOpenChange={() => setDeleteId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Item</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this item? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
};

export default Items;
