import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import type { FeaturedProductsBySection, FeaturedSectionKey, Product } from '@/types';
import { useAuth } from '@clerk/clerk-react';
import {
  createAdminProductWithImage,
  deleteAdminProduct,
  listFeaturedProducts,
  listProducts,
  replaceAdminProductImage,
  updateAdminFeaturedProducts,
  updateAdminProduct,
} from '@/lib/productsApi';

type ProductFormState = {
  name: string;
  price: string;
  stockQuantity: string;
  category: Product['category'];
  subcategory: string;
  description: string;
};

type ProductEditFormState = ProductFormState & {
  isActive: boolean;
};

const defaultProductForm: ProductFormState = {
  name: '',
  price: '',
  stockQuantity: '0',
  category: 'lip',
  subcategory: '',
  description: '',
};

const defaultEditForm: ProductEditFormState = {
  ...defaultProductForm,
  isActive: true,
};

const featuredSections: Array<{ key: FeaturedSectionKey; title: string; category: Product['category'] }> = [
  { key: 'story-aurevia', title: 'Story · Aurevia', category: 'lip' },
  { key: 'story-deconstructed', title: 'Story · Deconstructed', category: 'lip' },
  { key: 'shop-lip', title: 'Shop · Lip Color', category: 'lip' },
  { key: 'shop-skincare', title: 'Shop · Skincare', category: 'skincare' },
];

const catalogPageSize = 12;

function toStockQuantity(value: number | undefined) {
  if (!Number.isFinite(value) || (value ?? 0) < 0) {
    return 0;
  }

  return Math.floor(value ?? 0);
}

function stockLabel(stockQuantity: number | undefined) {
  const stock = toStockQuantity(stockQuantity);
  if (stock <= 0) {
    return 'Out of stock';
  }

  if (stock <= 10) {
    return `Low stock (${stock})`;
  }

  return `In stock (${stock})`;
}

export function AdminProductsPage() {
  const { getToken } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [featuredBySection, setFeaturedBySection] = useState<FeaturedProductsBySection>({
    'story-aurevia': [],
    'story-deconstructed': [],
    'shop-lip': [],
    'shop-skincare': [],
  });
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [form, setForm] = useState<ProductFormState>(defaultProductForm);
  const [createImageFile, setCreateImageFile] = useState<File | null>(null);
  const [createImageInputKey, setCreateImageInputKey] = useState(0);
  const [createImagePreview, setCreateImagePreview] = useState('');
  const [replaceImageFiles, setReplaceImageFiles] = useState<Record<string, File | null>>({});
  const [replaceImageInputKeys, setReplaceImageInputKeys] = useState<Record<string, number>>({});
  const [uploadingImageProductId, setUploadingImageProductId] = useState<string | null>(null);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<ProductEditFormState>(defaultEditForm);
  const [savingProductId, setSavingProductId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | Product['category']>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [catalogPage, setCatalogPage] = useState(1);
  const [isCreatingProduct, setIsCreatingProduct] = useState(false);
  const [savingSection, setSavingSection] = useState<FeaturedSectionKey | null>(null);

  const sortedProducts = useMemo(() => {
    return [...products].sort((a, b) => a.name.localeCompare(b.name));
  }, [products]);

  const filteredProducts = useMemo(() => {
    const normalizedSearch = searchQuery.trim().toLowerCase();

    return sortedProducts.filter((product) => {
      const matchesSearch = normalizedSearch.length === 0
        || product.name.toLowerCase().includes(normalizedSearch)
        || product.subcategory.toLowerCase().includes(normalizedSearch)
        || product.description.toLowerCase().includes(normalizedSearch)
        || product.id.toLowerCase().includes(normalizedSearch);

      const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter;
      const isActive = product.isActive !== false;
      const matchesStatus = statusFilter === 'all'
        || (statusFilter === 'active' && isActive)
        || (statusFilter === 'inactive' && !isActive);

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [categoryFilter, searchQuery, sortedProducts, statusFilter]);

  const catalogTotalPages = Math.max(1, Math.ceil(filteredProducts.length / catalogPageSize));

  const paginatedProducts = useMemo(() => {
    const start = (catalogPage - 1) * catalogPageSize;
    return filteredProducts.slice(start, start + catalogPageSize);
  }, [catalogPage, filteredProducts]);

  const loadProducts = async () => {
    setIsLoadingProducts(true);
    try {
      const [allProducts, featured] = await Promise.all([
        listProducts(undefined, true),
        listFeaturedProducts(),
      ]);

      setProducts(allProducts);
      setFeaturedBySection(featured);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not load products.';
      toast.error(message);
    } finally {
      setIsLoadingProducts(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    setCatalogPage(1);
  }, [searchQuery, categoryFilter, statusFilter]);

  useEffect(() => {
    setCatalogPage((current) => (current > catalogTotalPages ? catalogTotalPages : current));
  }, [catalogTotalPages]);

  useEffect(() => {
    if (!createImageFile) {
      setCreateImagePreview('');
      return;
    }

    const previewUrl = URL.createObjectURL(createImageFile);
    setCreateImagePreview(previewUrl);

    return () => {
      URL.revokeObjectURL(previewUrl);
    };
  }, [createImageFile]);

  const handleCreateProduct = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!createImageFile) {
      toast.error('Please choose an image file before creating the product.');
      return;
    }

    const parsedPrice = Number(form.price);
    if (!Number.isFinite(parsedPrice) || parsedPrice < 0) {
      toast.error('Price must be a valid non-negative number.');
      return;
    }

    const parsedStockQuantity = Number(form.stockQuantity);
    if (!Number.isInteger(parsedStockQuantity) || parsedStockQuantity < 0) {
      toast.error('Stock quantity must be a non-negative whole number.');
      return;
    }

    setIsCreatingProduct(true);

    try {
      const created = await createAdminProductWithImage({
        name: form.name.trim(),
        price: parsedPrice,
        stockQuantity: parsedStockQuantity,
        category: form.category,
        subcategory: form.subcategory.trim(),
        description: form.description.trim(),
        isActive: true,
      }, createImageFile, getToken);

      setProducts((current) => [...current, created]);
      setForm(defaultProductForm);
      setCreateImageFile(null);
      setCreateImageInputKey((current) => current + 1);
      toast.success('Product created successfully.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not create product.';
      toast.error(message);
    } finally {
      setIsCreatingProduct(false);
    }
  };

  const handleReplaceProductImage = async (product: Product) => {
    const file = replaceImageFiles[product.id];
    if (!file) {
      toast.error('Choose an image file before uploading.');
      return;
    }

    setUploadingImageProductId(product.id);
    try {
      const updated = await replaceAdminProductImage(product.id, file, getToken);
      setProducts((current) => current.map((item) => (item.id === product.id ? updated : item)));
      setReplaceImageFiles((current) => ({
        ...current,
        [product.id]: null,
      }));
      setReplaceImageInputKeys((current) => ({
        ...current,
        [product.id]: (current[product.id] ?? 0) + 1,
      }));
      toast.success(`${updated.name} image updated.`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not replace product image.';
      toast.error(message);
    } finally {
      setUploadingImageProductId(null);
    }
  };

  const handleStartEditingProduct = (product: Product) => {
    setEditingProductId(product.id);
    setEditForm({
      name: product.name,
      price: String(product.price),
      stockQuantity: String(toStockQuantity(product.stockQuantity)),
      category: product.category,
      subcategory: product.subcategory,
      description: product.description,
      isActive: product.isActive !== false,
    });
  };

  const handleCancelEditingProduct = () => {
    setEditingProductId(null);
    setEditForm(defaultEditForm);
  };

  const handleSaveProductEdits = async (event: React.FormEvent, productId: string) => {
    event.preventDefault();

    const parsedPrice = Number(editForm.price);
    if (!Number.isFinite(parsedPrice) || parsedPrice < 0) {
      toast.error('Price must be a valid non-negative number.');
      return;
    }

    const parsedStockQuantity = Number(editForm.stockQuantity);
    if (!Number.isInteger(parsedStockQuantity) || parsedStockQuantity < 0) {
      toast.error('Stock quantity must be a non-negative whole number.');
      return;
    }

    setSavingProductId(productId);
    try {
      const updated = await updateAdminProduct(productId, {
        name: editForm.name.trim(),
        price: parsedPrice,
        stockQuantity: parsedStockQuantity,
        category: editForm.category,
        subcategory: editForm.subcategory.trim(),
        description: editForm.description.trim(),
        isActive: editForm.isActive,
      }, getToken);

      setProducts((current) => current.map((item) => (item.id === productId ? updated : item)));
      setEditingProductId(null);
      setEditForm(defaultEditForm);
      toast.success(`${updated.name} updated.`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not update product.';
      toast.error(message);
    } finally {
      setSavingProductId(null);
    }
  };

  const handleToggleProduct = async (product: Product) => {
    try {
      const updated = await updateAdminProduct(product.id, {
        isActive: product.isActive === false,
      }, getToken);

      setProducts((current) => current.map((item) => (item.id === product.id ? updated : item)));
      toast.success(`${updated.name} is now ${updated.isActive === false ? 'inactive' : 'active'}.`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not update product.';
      toast.error(message);
    }
  };

  const handleDeleteProduct = async (product: Product) => {
    try {
      await deleteAdminProduct(product.id, getToken);
      setProducts((current) => current.filter((item) => item.id !== product.id));
      if (editingProductId === product.id) {
        handleCancelEditingProduct();
      }
      toast.success(`${product.name} deleted.`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not delete product.';
      toast.error(message);
    }
  };

  const handleToggleFeaturedProduct = async (sectionKey: FeaturedSectionKey, product: Product) => {
    const currentProducts = featuredBySection[sectionKey] ?? [];
    const isSelected = currentProducts.some((item) => item.id === product.id);
    const nextIds = isSelected
      ? currentProducts.filter((item) => item.id !== product.id).map((item) => item.id)
      : [...currentProducts.map((item) => item.id), product.id];

    setSavingSection(sectionKey);
    try {
      const updatedProducts = await updateAdminFeaturedProducts(sectionKey, nextIds, getToken);
      setFeaturedBySection((current) => ({
        ...current,
        [sectionKey]: updatedProducts,
      }));
      toast.success('Featured products updated.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not update featured products.';
      toast.error(message);
    } finally {
      setSavingSection(null);
    }
  };

  return (
    <section className="space-y-4">
      <h2 className="text-2xl font-bold" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
        Products
      </h2>

      <div className="bg-white border border-[#0B0B0D]/10 p-6">
        <h3 className="text-lg font-semibold mb-4">Create Product</h3>
        <form onSubmit={handleCreateProduct} className="grid md:grid-cols-2 gap-3 mb-6">
          <input
            value={form.name}
            onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
            className="border border-[#0B0B0D]/20 px-3 py-2"
            placeholder="Product name"
            required
          />
          <input
            value={form.price}
            type="number"
            min="0"
            step="0.01"
            onChange={(event) => setForm((current) => ({ ...current, price: event.target.value }))}
            className="border border-[#0B0B0D]/20 px-3 py-2"
            placeholder="Price"
            required
          />
          <input
            value={form.stockQuantity}
            type="number"
            min="0"
            step="1"
            onChange={(event) => setForm((current) => ({ ...current, stockQuantity: event.target.value }))}
            className="border border-[#0B0B0D]/20 px-3 py-2"
            placeholder="Stock quantity"
            required
          />
          <select
            value={form.category}
            onChange={(event) => setForm((current) => ({ ...current, category: event.target.value as Product['category'] }))}
            className="border border-[#0B0B0D]/20 px-3 py-2"
          >
            <option value="lip">Lip</option>
            <option value="skincare">Skincare</option>
          </select>
          <input
            value={form.subcategory}
            onChange={(event) => setForm((current) => ({ ...current, subcategory: event.target.value }))}
            className="border border-[#0B0B0D]/20 px-3 py-2"
            placeholder="Subcategory"
            required
          />
          <div className="md:col-span-2 space-y-2">
            <input
              key={createImageInputKey}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(event) => {
                setCreateImageFile(event.target.files?.[0] ?? null);
              }}
              className="border border-[#0B0B0D]/20 px-3 py-2 w-full"
              required
            />
            <p className="text-xs text-[#6E6E73]">Accepted formats: JPG, PNG, WEBP. Max size: 10MB.</p>
            {createImagePreview ? (
              <img
                src={createImagePreview}
                alt="New product preview"
                className="h-28 w-28 object-cover border border-[#0B0B0D]/10"
              />
            ) : null}
          </div>
          <textarea
            value={form.description}
            onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
            className="border border-[#0B0B0D]/20 px-3 py-2 md:col-span-2"
            placeholder="Description"
            required
          />
          <button type="submit" className="btn-pink md:col-span-2" disabled={isCreatingProduct}>
            {isCreatingProduct ? 'Adding product...' : 'Add Product'}
          </button>
        </form>

        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold">Catalog</h3>
          <button onClick={loadProducts} className="btn-pink-outline px-4 py-2 text-sm">Refresh</button>
        </div>

        <div className="grid md:grid-cols-3 gap-2 mb-3">
          <input
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            className="border border-[#0B0B0D]/20 px-3 py-2"
            placeholder="Search by name, subcategory, description, or ID"
          />
          <select
            value={categoryFilter}
            onChange={(event) => setCategoryFilter(event.target.value as 'all' | Product['category'])}
            className="border border-[#0B0B0D]/20 px-3 py-2"
          >
            <option value="all">All categories</option>
            <option value="lip">Lip</option>
            <option value="skincare">Skincare</option>
          </select>
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as 'all' | 'active' | 'inactive')}
            className="border border-[#0B0B0D]/20 px-3 py-2"
          >
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        <p className="text-sm text-[#6E6E73] mb-3">
          Showing {paginatedProducts.length} of {filteredProducts.length} filtered product{filteredProducts.length === 1 ? '' : 's'}
          {' '}
          (page {catalogPage} of {catalogTotalPages})
        </p>

        {isLoadingProducts ? (
          <p className="text-[#6E6E73]">Loading products...</p>
        ) : (
          <div className="divide-y divide-[#0B0B0D]/10">
            {paginatedProducts.map((product) => (
              <div key={product.id} className="py-3 space-y-3">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                  <div>
                    <p className="font-medium">{product.name}</p>
                    <p className="text-sm text-[#6E6E73]">
                      {product.category} · {product.subcategory} · ${product.price} · {product.isActive === false ? 'inactive' : 'active'}
                    </p>
                    <p className="text-sm text-[#6E6E73]">{stockLabel(product.stockQuantity)}</p>
                  </div>
                  <div className="space-y-2 md:text-right">
                    <div className="flex gap-2 md:justify-end flex-wrap">
                      <button
                        onClick={() => handleStartEditingProduct(product)}
                        className="btn-pink-outline px-3 py-2 text-sm"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleToggleProduct(product)}
                        className="btn-pink-outline px-3 py-2 text-sm"
                      >
                        {product.isActive === false ? 'Activate' : 'Deactivate'}
                      </button>
                      <button
                        onClick={() => handleDeleteProduct(product)}
                        className="btn-pink-outline px-3 py-2 text-sm"
                      >
                        Delete
                      </button>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2 md:justify-end">
                      <input
                        key={replaceImageInputKeys[product.id] ?? 0}
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={(event) => {
                          setReplaceImageFiles((current) => ({
                            ...current,
                            [product.id]: event.target.files?.[0] ?? null,
                          }));
                        }}
                        className="border border-[#0B0B0D]/20 px-3 py-2 text-sm"
                      />
                      <button
                        onClick={() => handleReplaceProductImage(product)}
                        className="btn-pink-outline px-3 py-2 text-sm"
                        disabled={uploadingImageProductId === product.id}
                      >
                        {uploadingImageProductId === product.id ? 'Uploading...' : 'Replace Image'}
                      </button>
                    </div>
                  </div>
                </div>

                {editingProductId === product.id ? (
                  <form
                    onSubmit={(event) => {
                      void handleSaveProductEdits(event, product.id);
                    }}
                    className="grid md:grid-cols-2 gap-2 border border-[#0B0B0D]/10 p-3"
                  >
                    <input
                      value={editForm.name}
                      onChange={(event) => setEditForm((current) => ({ ...current, name: event.target.value }))}
                      className="border border-[#0B0B0D]/20 px-3 py-2"
                      placeholder="Product name"
                      required
                    />
                    <input
                      value={editForm.price}
                      type="number"
                      min="0"
                      step="0.01"
                      onChange={(event) => setEditForm((current) => ({ ...current, price: event.target.value }))}
                      className="border border-[#0B0B0D]/20 px-3 py-2"
                      placeholder="Price"
                      required
                    />
                    <input
                      value={editForm.stockQuantity}
                      type="number"
                      min="0"
                      step="1"
                      onChange={(event) => setEditForm((current) => ({ ...current, stockQuantity: event.target.value }))}
                      className="border border-[#0B0B0D]/20 px-3 py-2"
                      placeholder="Stock quantity"
                      required
                    />
                    <select
                      value={editForm.category}
                      onChange={(event) => setEditForm((current) => ({ ...current, category: event.target.value as Product['category'] }))}
                      className="border border-[#0B0B0D]/20 px-3 py-2"
                    >
                      <option value="lip">Lip</option>
                      <option value="skincare">Skincare</option>
                    </select>
                    <input
                      value={editForm.subcategory}
                      onChange={(event) => setEditForm((current) => ({ ...current, subcategory: event.target.value }))}
                      className="border border-[#0B0B0D]/20 px-3 py-2"
                      placeholder="Subcategory"
                      required
                    />
                    <textarea
                      value={editForm.description}
                      onChange={(event) => setEditForm((current) => ({ ...current, description: event.target.value }))}
                      className="border border-[#0B0B0D]/20 px-3 py-2 md:col-span-2"
                      placeholder="Description"
                      required
                    />
                    <label className="flex items-center gap-2 text-sm md:col-span-2">
                      <input
                        type="checkbox"
                        checked={editForm.isActive}
                        onChange={(event) => setEditForm((current) => ({ ...current, isActive: event.target.checked }))}
                      />
                      Product is active
                    </label>
                    <div className="md:col-span-2 flex gap-2">
                      <button
                        type="button"
                        onClick={handleCancelEditingProduct}
                        className="btn-pink-outline px-3 py-2 text-sm"
                        disabled={savingProductId === product.id}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="btn-pink px-3 py-2 text-sm"
                        disabled={savingProductId === product.id}
                      >
                        {savingProductId === product.id ? 'Saving...' : 'Save Changes'}
                      </button>
                    </div>
                  </form>
                ) : null}
              </div>
            ))}

            {filteredProducts.length === 0 && <p className="text-[#6E6E73] py-3">No products match this filter.</p>}
          </div>
        )}

        {!isLoadingProducts && filteredProducts.length > 0 ? (
          <div className="flex items-center justify-between mt-4">
            <button
              onClick={() => setCatalogPage((current) => Math.max(1, current - 1))}
              className="btn-pink-outline px-4 py-2 text-sm"
              disabled={catalogPage <= 1}
            >
              Previous
            </button>
            <p className="text-sm text-[#6E6E73]">Page {catalogPage} of {catalogTotalPages}</p>
            <button
              onClick={() => setCatalogPage((current) => Math.min(catalogTotalPages, current + 1))}
              className="btn-pink-outline px-4 py-2 text-sm"
              disabled={catalogPage >= catalogTotalPages}
            >
              Next
            </button>
          </div>
        ) : null}
      </div>

      <div className="bg-white border border-[#0B0B0D]/10 p-6">
        <h3 className="text-lg font-semibold mb-4">Featured Products by Section</h3>
        <p className="text-sm text-[#6E6E73] mb-5">
          Select multiple featured products for each section. These appear as carousels on the live site.
        </p>

        <div className="space-y-6">
          {featuredSections.map((section) => {
            const sectionProducts = sortedProducts.filter(
              (product) => product.category === section.category && product.isActive !== false
            );
            const selectedIds = new Set((featuredBySection[section.key] ?? []).map((product) => product.id));

            return (
              <div key={section.key} className="border border-[#0B0B0D]/10 p-4">
                <div className="mb-3">
                  <p className="font-medium">{section.title}</p>
                  <p className="text-sm text-[#6E6E73]">
                    {selectedIds.size} featured product{selectedIds.size === 1 ? '' : 's'} selected
                  </p>
                </div>

                <div className="grid md:grid-cols-2 gap-2">
                  {sectionProducts.map((product) => {
                    const checked = selectedIds.has(product.id);

                    return (
                      <label
                        key={product.id}
                        className="flex items-center gap-2 border border-[#0B0B0D]/10 px-3 py-2 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => handleToggleFeaturedProduct(section.key, product)}
                          disabled={savingSection === section.key}
                        />
                        <span className="text-sm">{product.name}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
