import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import type { FeaturedProductsBySection, FeaturedSectionKey, Product } from '@/types';
import {
  createAdminProduct,
  deleteAdminProduct,
  listFeaturedProducts,
  listProducts,
  updateAdminFeaturedProducts,
  updateAdminProduct,
} from '@/lib/productsApi';

type ProductFormState = {
  name: string;
  price: string;
  category: Product['category'];
  subcategory: string;
  image: string;
  description: string;
};

const defaultProductForm: ProductFormState = {
  name: '',
  price: '',
  category: 'lip',
  subcategory: '',
  image: '',
  description: '',
};

const featuredSections: Array<{ key: FeaturedSectionKey; title: string; category: Product['category'] }> = [
  { key: 'story-aurevia', title: 'Story · Aurevia', category: 'lip' },
  { key: 'story-deconstructed', title: 'Story · Deconstructed', category: 'lip' },
  { key: 'shop-lip', title: 'Shop · Lip Color', category: 'lip' },
  { key: 'shop-skincare', title: 'Shop · Skincare', category: 'skincare' },
];

export function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [featuredBySection, setFeaturedBySection] = useState<FeaturedProductsBySection>({
    'story-aurevia': [],
    'story-deconstructed': [],
    'shop-lip': [],
    'shop-skincare': [],
  });
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [form, setForm] = useState<ProductFormState>(defaultProductForm);
  const [isCreatingProduct, setIsCreatingProduct] = useState(false);
  const [savingSection, setSavingSection] = useState<FeaturedSectionKey | null>(null);

  const sortedProducts = useMemo(() => {
    return [...products].sort((a, b) => a.name.localeCompare(b.name));
  }, [products]);

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

  const handleCreateProduct = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsCreatingProduct(true);

    try {
      const created = await createAdminProduct({
        name: form.name.trim(),
        price: Number(form.price),
        category: form.category,
        subcategory: form.subcategory.trim(),
        image: form.image.trim(),
        description: form.description.trim(),
        isActive: true,
      });

      setProducts((current) => [...current, created]);
      setForm(defaultProductForm);
      toast.success('Product created successfully.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not create product.';
      toast.error(message);
    } finally {
      setIsCreatingProduct(false);
    }
  };

  const handleToggleProduct = async (product: Product) => {
    try {
      const updated = await updateAdminProduct(product.id, {
        isActive: product.isActive === false,
      });

      setProducts((current) => current.map((item) => (item.id === product.id ? updated : item)));
      toast.success(`${updated.name} is now ${updated.isActive === false ? 'inactive' : 'active'}.`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not update product.';
      toast.error(message);
    }
  };

  const handleDeleteProduct = async (product: Product) => {
    try {
      await deleteAdminProduct(product.id);
      setProducts((current) => current.filter((item) => item.id !== product.id));
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
      const updatedProducts = await updateAdminFeaturedProducts(sectionKey, nextIds);
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
          <input
            value={form.image}
            onChange={(event) => setForm((current) => ({ ...current, image: event.target.value }))}
            className="border border-[#0B0B0D]/20 px-3 py-2 md:col-span-2"
            placeholder="Image path (/product_example.jpg)"
            required
          />
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

        {isLoadingProducts ? (
          <p className="text-[#6E6E73]">Loading products...</p>
        ) : (
          <div className="divide-y divide-[#0B0B0D]/10">
            {sortedProducts.map((product) => (
              <div key={product.id} className="py-3 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div>
                  <p className="font-medium">{product.name}</p>
                  <p className="text-sm text-[#6E6E73]">
                    {product.category} · {product.subcategory} · ${product.price} · {product.isActive === false ? 'inactive' : 'active'}
                  </p>
                </div>
                <div className="flex gap-2">
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
              </div>
            ))}

            {sortedProducts.length === 0 && <p className="text-[#6E6E73] py-3">No products yet.</p>}
          </div>
        )}
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
