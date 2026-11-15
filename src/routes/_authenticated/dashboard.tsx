import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { FileText, LogOut, Megaphone, Plus, Trash2, Upload } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useStoreImage } from "@/hooks/useStoreImage";
import { supabase } from "@/integrations/supabase/client";
import { OrderSlipDialog } from "@/components/site/OrderSlip";
import type { OrderRecord } from "@/lib/orders";
import { fetchAllOrders, setOrderStatus } from "@/lib/orders";
import {
  createPoster,
  deletePoster,
  fetchAllPosters,
  updatePoster,
  type Poster,
} from "@/lib/posters";
import { useAllCategories, useCategories } from "@/hooks/useCategories";
import {
  SETTING_FIELDS,
  fetchAllProducts,
  fetchDocuments,
  fetchSettings,
  formatPrice,
  slugify,
  type Category,
  type Product,
  type StoreDocument,
} from "@/lib/store";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Owner Dashboard | Intellectual Mindset Clothing" },
      {
        name: "description",
        content: "Private dashboard to manage products, prices, images and PDF documents.",
      },
      { property: "og:title", content: "Owner dashboard" },
      { property: "og:description", content: "Manage products, prices and documents." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Dashboard,
});

function useIsAdmin() {
  return useQuery({
    queryKey: ["is-admin"],
    queryFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return false;
      const { data, error } = await supabase.rpc("has_role", {
        _user_id: userData.user.id,
        _role: "admin",
      });
      if (error) throw error;
      return Boolean(data);
    },
  });
}

async function uploadFile(bucket: string, file: File) {
  const ext = file.name.split(".").pop() ?? "bin";
  const path = `${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: false });
  if (error) throw error;
  return path;
}

/* ---------------------------------- Products --------------------------------- */

const emptyProduct = {
  name: "",
  category: "hoodies",
  description: "",
  price: "",
  compare_price: "",
  sizes: "",
  colors: "",
  image_url: "",
  is_featured: false,
  is_visible: true,
};

function ProductRow({ product }: { product: Product }) {
  const qc = useQueryClient();
  const image = useStoreImage("product-images", product.image_url);
  const [price, setPrice] = useState(String(product.price));
  const [name, setName] = useState(product.name);
  const [uploading, setUploading] = useState(false);
  const [addingImages, setAddingImages] = useState(false);

  const update = useMutation({
    mutationFn: async (patch: Partial<Product>) => {
      const { error } = await supabase.from("products").update(patch).eq("id", product.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Saved");
      void qc.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("products").delete().eq("id", product.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Product deleted");
      void qc.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  async function onImage(file: File) {
    setUploading(true);
    try {
      const path = await uploadFile("product-images", file);
      await update.mutateAsync({ image_url: path });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function onGallery(files: FileList) {
    setAddingImages(true);
    try {
      const paths: string[] = [];
      for (const file of Array.from(files)) {
        paths.push(await uploadFile("product-images", file));
      }
      await update.mutateAsync({ gallery: [...(product.gallery ?? []), ...paths] });
      toast.success(`${paths.length} image(s) added`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setAddingImages(false);
    }
  }

  return (
    <div className="grid gap-4 border border-border p-4 sm:grid-cols-[96px_1fr]">
      <div className="relative aspect-square w-24 overflow-hidden bg-secondary">
        {image ? (
          <img src={image} alt={product.name} className="size-full object-cover" />
        ) : (
          <div className="flex size-full items-center justify-center text-xs text-muted-foreground">
            No image
          </div>
        )}
      </div>

      <div className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <Label className="label-tag">Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label className="label-tag">Price (N$)</Label>
            <Input
              type="number"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <span className="label-tag text-muted-foreground">
            {product.category} · {formatPrice(product.price, product.currency)}
          </span>
          <label className="flex items-center gap-2 text-xs">
            <Switch
              checked={product.is_visible}
              onCheckedChange={(v) => update.mutate({ is_visible: v })}
            />
            Visible
          </label>
          <label className="flex items-center gap-2 text-xs">
            <Switch
              checked={product.is_featured}
              onCheckedChange={(v) => update.mutate({ is_featured: v })}
            />
            Featured
          </label>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            onClick={() => update.mutate({ name, price: Number(price) })}
            disabled={update.isPending}
          >
            Save changes
          </Button>
          <label className="inline-flex cursor-pointer items-center gap-2 border border-border px-3 py-1.5 text-xs">
            <Upload className="size-3.5" />
            {uploading ? "Uploading…" : "Replace main image"}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void onImage(file);
              }}
            />
          </label>
          <label className="inline-flex cursor-pointer items-center gap-2 border border-border px-3 py-1.5 text-xs">
            <Upload className="size-3.5" />
            {addingImages
              ? "Uploading…"
              : `Add more images (${(product.gallery ?? []).length})`}
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => {
                const files = e.target.files;
                if (files && files.length) void onGallery(files);
              }}
            />
          </label>
          {(product.gallery ?? []).length ? (
            <Button size="sm" variant="outline" onClick={() => update.mutate({ gallery: [] })}>
              Clear extra images
            </Button>
          ) : null}
          <Button
            size="sm"
            variant="destructive"
            onClick={() => remove.mutate()}
            disabled={remove.isPending}
          >
            <Trash2 className="size-3.5" /> Delete
          </Button>
        </div>
      </div>
    </div>
  );
}

function NewProductForm() {
  const qc = useQueryClient();
  const [form, setForm] = useState({ ...emptyProduct });
  const { categories } = useCategories();
  const [file, setFile] = useState<File | null>(null);
  const [extraFiles, setExtraFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      let imagePath = form.image_url.trim();
      if (file) imagePath = await uploadFile("product-images", file);
      const galleryPaths: string[] = [];
      for (const extra of extraFiles) {
        galleryPaths.push(await uploadFile("product-images", extra));
      }
      const { error } = await supabase.from("products").insert({
        name: form.name,
        category: form.category,
        description: form.description || null,
        price: Number(form.price || 0),
        compare_price: form.compare_price ? Number(form.compare_price) : null,
        sizes: form.sizes ? form.sizes.split(",").map((s) => s.trim()) : [],
        colors: form.colors ? form.colors.split(",").map((s) => s.trim()) : [],
        image_url: imagePath || null,
        gallery: galleryPaths,
        is_featured: form.is_featured,
        is_visible: form.is_visible,
      });
      if (error) throw error;
      toast.success("Product added");
      setForm({ ...emptyProduct });
      setFile(null);
      setExtraFiles([]);
      void qc.invalidateQueries({ queryKey: ["products"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not add product");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4 border border-border bg-card p-5">
      <h2 className="text-2xl uppercase">Add product</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1">
          <Label className="label-tag">Name</Label>
          <Input
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </div>
        <div className="space-y-1">
          <Label className="label-tag">Category</Label>
          <select
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            className="h-9 w-full border border-input bg-background px-3 text-sm"
          >
            {categories.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <Label className="label-tag">Price (N$)</Label>
          <Input
            required
            type="number"
            step="0.01"
            value={form.price}
            onChange={(e) => setForm({ ...form, price: e.target.value })}
          />
        </div>
        <div className="space-y-1">
          <Label className="label-tag">Was price (optional)</Label>
          <Input
            type="number"
            step="0.01"
            value={form.compare_price}
            onChange={(e) => setForm({ ...form, compare_price: e.target.value })}
          />
        </div>
        <div className="space-y-1">
          <Label className="label-tag">Sizes (comma separated)</Label>
          <Input
            value={form.sizes}
            onChange={(e) => setForm({ ...form, sizes: e.target.value })}
            placeholder="S, M, L, XL"
          />
        </div>
        <div className="space-y-1">
          <Label className="label-tag">Colours (comma separated)</Label>
          <Input
            value={form.colors}
            onChange={(e) => setForm({ ...form, colors: e.target.value })}
            placeholder="Black, Lime"
          />
        </div>
      </div>

      <div className="space-y-1">
        <Label className="label-tag">Description</Label>
        <Textarea
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <label className="inline-flex cursor-pointer items-center gap-2 border border-border px-3 py-2 text-xs">
          <Upload className="size-4" />
          {file ? file.name : "Upload image"}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
        </label>
        <label className="inline-flex cursor-pointer items-center gap-2 border border-border px-3 py-2 text-xs">
          <Upload className="size-4" />
          {extraFiles.length ? `${extraFiles.length} extra image(s)` : "Add more images"}
          <input
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => setExtraFiles(Array.from(e.target.files ?? []))}
          />
        </label>
        <label className="flex items-center gap-2 text-xs">
          <Switch
            checked={form.is_visible}
            onCheckedChange={(v) => setForm({ ...form, is_visible: v })}
          />
          Visible on site
        </label>
        <label className="flex items-center gap-2 text-xs">
          <Switch
            checked={form.is_featured}
            onCheckedChange={(v) => setForm({ ...form, is_featured: v })}
          />
          Feature on home
        </label>
      </div>

      <Button type="submit" disabled={busy} className="bg-lime text-lime-foreground hover:bg-lime/90">
        <Plus className="size-4" /> {busy ? "Saving…" : "Add product"}
      </Button>
    </form>
  );
}

/* --------------------------------- Categories -------------------------------- */

function CategoryRow({ category }: { category: Category }) {
  const qc = useQueryClient();
  const [label, setLabel] = useState(category.label);
  const [sortOrder, setSortOrder] = useState(String(category.sort_order));
  const [busy, setBusy] = useState(false);

  const refresh = () => {
    void qc.invalidateQueries({ queryKey: ["categories"] });
  };

  async function save() {
    setBusy(true);
    try {
      const { error } = await supabase
        .from("categories")
        .update({ label, sort_order: Number(sortOrder || 0) })
        .eq("id", category.id);
      if (error) throw error;
      toast.success("Category updated");
      refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not update category");
    } finally {
      setBusy(false);
    }
  }

  async function toggleVisible(next: boolean) {
    const { error } = await supabase
      .from("categories")
      .update({ is_visible: next })
      .eq("id", category.id);
    if (error) toast.error(error.message);
    else refresh();
  }

  async function remove() {
    if (!confirm(`Delete the "${category.label}" category? Products keep their tag.`)) return;
    const { error } = await supabase.from("categories").delete().eq("id", category.id);
    if (error) toast.error(error.message);
    else {
      toast.success("Category deleted");
      refresh();
    }
  }

  return (
    <div className="grid gap-3 border border-border bg-card p-4 sm:grid-cols-[1fr_auto_auto_auto] sm:items-end">
      <div className="space-y-1">
        <Label className="label-tag">Name</Label>
        <Input value={label} onChange={(e) => setLabel(e.target.value)} />
        <p className="text-xs text-muted-foreground">Web tag: {category.slug}</p>
      </div>
      <div className="space-y-1">
        <Label className="label-tag">Order</Label>
        <Input
          type="number"
          className="w-20"
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value)}
        />
      </div>
      <div className="flex items-center gap-2">
        <Switch checked={category.is_visible} onCheckedChange={(v) => void toggleVisible(v)} />
        <span className="label-tag">Visible</span>
      </div>
      <div className="flex gap-2">
        <Button size="sm" disabled={busy} onClick={() => void save()}>
          Save
        </Button>
        <Button size="sm" variant="outline" onClick={() => void remove()}>
          <Trash2 className="size-4" />
        </Button>
      </div>
    </div>
  );
}

function CategoriesTab() {
  const qc = useQueryClient();
  const { data: categories, isPending } = useAllCategories();
  const [label, setLabel] = useState("");
  const [busy, setBusy] = useState(false);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    const slug = slugify(label);
    if (!slug) {
      toast.error("Enter a category name");
      return;
    }
    setBusy(true);
    try {
      const { error } = await supabase.from("categories").insert({
        label: label.trim(),
        slug,
        sort_order: (categories?.length ?? 0) + 1,
      });
      if (error) throw error;
      toast.success("Category added");
      setLabel("");
      void qc.invalidateQueries({ queryKey: ["categories"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not add category");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <form onSubmit={add} className="space-y-4 border border-border bg-card p-5">
        <h2 className="text-2xl uppercase">Add category</h2>
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-48 flex-1 space-y-1">
            <Label className="label-tag">Category name</Label>
            <Input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g. Caps"
            />
          </div>
          <Button type="submit" disabled={busy}>
            <Plus className="mr-1 size-4" /> Add
          </Button>
        </div>
      </form>

      <div className="space-y-3">
        {(categories ?? []).map((c) => (
          <CategoryRow key={c.id} category={c} />
        ))}
        {!isPending && (categories ?? []).length === 0 ? (
          <p className="text-sm text-muted-foreground">No categories yet — add your first one.</p>
        ) : null}
      </div>
    </div>
  );
}

function ProductsTab() {
  const { data: products, isPending } = useQuery({
    queryKey: ["products", "all"],
    queryFn: fetchAllProducts,
  });
  const { categories } = useCategories();
  const [category, setCategory] = useState<string>("all");
  const list = (products ?? []).filter((p) => category === "all" || p.category === category);

  return (
    <div className="space-y-6">
      <NewProductForm />

      <div className="flex flex-wrap gap-2">
        {[{ slug: "all", label: "All" }, ...categories].map((c) => (
          <button
            key={c.slug}
            type="button"
            onClick={() => setCategory(c.slug)}
            className={`label-tag px-3 py-2 ${
              category === c.slug ? "bg-ink text-ink-foreground" : "border border-border"
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {list.map((product) => (
          <ProductRow key={product.id} product={product} />
        ))}
        {!isPending && list.length === 0 ? (
          <p className="text-sm text-muted-foreground">No products in this tab yet.</p>
        ) : null}
      </div>
    </div>
  );
}

/* --------------------------------- Documents -------------------------------- */

function DocumentsTab() {
  const qc = useQueryClient();
  const { data: docs } = useQuery({
    queryKey: ["documents", "all"],
    queryFn: () => fetchDocuments(false),
  });
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) {
      toast.error("Choose a PDF first");
      return;
    }
    setBusy(true);
    try {
      const path = await uploadFile("documents", file);
      const { error } = await supabase
        .from("documents")
        .insert({ title, description: description || null, file_url: path, is_visible: true });
      if (error) throw error;
      toast.success("Document published");
      setTitle("");
      setDescription("");
      setFile(null);
      void qc.invalidateQueries({ queryKey: ["documents"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  }

  async function toggle(doc: StoreDocument) {
    const { error } = await supabase
      .from("documents")
      .update({ is_visible: !doc.is_visible })
      .eq("id", doc.id);
    if (error) toast.error(error.message);
    else void qc.invalidateQueries({ queryKey: ["documents"] });
  }

  async function remove(doc: StoreDocument) {
    const { error } = await supabase.from("documents").delete().eq("id", doc.id);
    if (error) toast.error(error.message);
    else {
      toast.success("Deleted");
      void qc.invalidateQueries({ queryKey: ["documents"] });
    }
  }

  return (
    <div className="space-y-6">
      <form onSubmit={submit} className="space-y-4 border border-border bg-card p-5">
        <h2 className="text-2xl uppercase">Upload PDF for customers</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <Label className="label-tag">Title</Label>
            <Input required value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label className="label-tag">Description</Label>
            <Input value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
        </div>
        <label className="inline-flex cursor-pointer items-center gap-2 border border-border px-3 py-2 text-xs">
          <FileText className="size-4" />
          {file ? file.name : "Choose PDF"}
          <input
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
        </label>
        <Button type="submit" disabled={busy} className="bg-lime text-lime-foreground hover:bg-lime/90">
          {busy ? "Uploading…" : "Publish document"}
        </Button>
      </form>

      <div className="space-y-3">
        {(docs ?? []).map((doc) => (
          <div
            key={doc.id}
            className="flex flex-wrap items-center justify-between gap-3 border border-border p-4"
          >
            <div>
              <p className="text-lg uppercase">{doc.title}</p>
              {doc.description ? (
                <p className="text-xs text-muted-foreground">{doc.description}</p>
              ) : null}
            </div>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-xs">
                <Switch checked={doc.is_visible} onCheckedChange={() => void toggle(doc)} />
                Visible
              </label>
              <Button size="sm" variant="destructive" onClick={() => void remove(doc)}>
                <Trash2 className="size-3.5" /> Delete
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* --------------------------------- Settings --------------------------------- */

function SettingsTab() {
  const qc = useQueryClient();
  const { data: settings } = useQuery({ queryKey: ["site-settings"], queryFn: fetchSettings });
  const [draft, setDraft] = useState<Record<string, string> | null>(null);
  const values = draft ?? settings ?? {};
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    try {
      for (const field of SETTING_FIELDS) {
        const { error } = await supabase
          .from("site_settings")
          .upsert({ key: field.key, value: values[field.key] ?? "" }, { onConflict: "key" });
        if (error) throw error;
      }
      toast.success("Site content updated");
      void qc.invalidateQueries({ queryKey: ["site-settings"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4 border border-border bg-card p-5">
      <h2 className="text-2xl uppercase">Website content</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        {SETTING_FIELDS.map((field) => (
          <div key={field.key} className="space-y-1">
            <Label className="label-tag">{field.label}</Label>
            {field.key === "about" ? (
              <Textarea
                rows={5}
                value={values[field.key] ?? ""}
                onChange={(e) => setDraft({ ...values, [field.key]: e.target.value })}
              />
            ) : (
              <Input
                value={values[field.key] ?? ""}
                onChange={(e) => setDraft({ ...values, [field.key]: e.target.value })}
              />
            )}
          </div>
        ))}
      </div>
      <Button onClick={save} disabled={busy} className="bg-lime text-lime-foreground hover:bg-lime/90">
        {busy ? "Saving…" : "Save website content"}
      </Button>
    </div>
  );
}

/* ------------------------------- AI assistant ------------------------------ */

function AssistantTab() {
  const [apiKey, setApiKey] = useState("");
  const [busy, setBusy] = useState(false);
  const { data: isSet, refetch } = useQuery({
    queryKey: ["ai-key-set"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("admin_secret_is_set", { _key: "ai_api_key" });
      if (error) throw error;
      return Boolean(data);
    },
  });

  async function save(value: string) {
    setBusy(true);
    try {
      const { error } = await supabase.rpc("admin_set_secret", {
        _key: "ai_api_key",
        _value: value,
      });
      if (error) throw error;
      setApiKey("");
      toast.success(value ? "AI key saved" : "AI key removed");
      void refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save the key");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4 border border-border bg-card p-5">
      <div>
        <h2 className="text-2xl uppercase">Chat assistant key</h2>
        <p className="text-xs text-muted-foreground">
          Only you can see and change this. The assistant already works without a key — add your own
          OpenAI key here if you would rather it run on your account. The saved key is never shown
          again and is never sent to the website.
        </p>
      </div>
      <p className="label-tag">
        Status: {isSet ? "Your own key is in use" : "Using the built-in assistant"}
      </p>
      <div className="space-y-1">
        <Label className="label-tag">AI API key</Label>
        <Input
          type="password"
          placeholder="sk-…"
          autoComplete="off"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
        />
      </div>
      <div className="flex flex-wrap gap-2">
        <Button
          onClick={() => void save(apiKey.trim())}
          disabled={busy || !apiKey.trim()}
          className="bg-lime text-lime-foreground hover:bg-lime/90"
        >
          {busy ? "Saving…" : "Save key"}
        </Button>
        {isSet ? (
          <Button variant="outline" disabled={busy} onClick={() => void save("")}>
            Remove key
          </Button>
        ) : null}
      </div>
    </div>
  );
}



/* ---------------------------------- Orders --------------------------------- */

function OrdersTab() {
  const [slip, setSlip] = useState<OrderRecord | null>(null);
  const qc = useQueryClient();
  const { data: orders, isPending } = useQuery({
    queryKey: ["admin-orders"],
    queryFn: fetchAllOrders,
  });

  async function mark(id: string, status: string) {
    try {
      await setOrderStatus(id, status);
      toast.success(`Order marked ${status}`);
      void qc.invalidateQueries({ queryKey: ["admin-orders"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not update the order");
    }
  }

  return (
    <div className="space-y-4">
      <OrderSlipDialog order={slip} onClose={() => setSlip(null)} />
      <h2 className="text-2xl uppercase">Orders & slips</h2>
      <p className="text-sm text-muted-foreground">
        Customer orders and branded order slips.
      </p>
      {isPending ? <p className="text-sm text-muted-foreground">Loading…</p> : null}
      <div className="divide-y divide-border border border-border">
        {(orders ?? []).map((o) => (
          <div key={o.id} className="flex flex-wrap items-start justify-between gap-3 p-4">
            <div>
              <p className="text-sm uppercase">
                {o.customer_name}
                <span className="ml-2 label-tag text-muted-foreground">{o.status}</span>
              </p>
              <p className="text-xs text-muted-foreground">
                {o.product_name}
                {[o.color, o.size].filter(Boolean).length
                  ? ` · ${[o.color, o.size].filter(Boolean).join(" · ")}`
                  : ""}{" "}
                · x{o.quantity} · {({ bank_card: "bank card", crypto: "crypto" } as Record<string, string>)[o.payment_method] ?? "payment on request"}
              </p>
              <p className="text-xs text-muted-foreground">
                {o.phone}
                {o.email ? ` · ${o.email}` : ""} · {new Date(o.created_at).toLocaleString()}
              </p>
              {o.note ? <p className="mt-1 text-xs">“{o.note}”</p> : null}
            </div>
            <div className="flex flex-col items-end gap-2">
              <p className="text-sm font-semibold">{formatPrice(Number(o.amount), o.currency)}</p>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={() => setSlip(o)}><FileText className="size-4" /> Slip</Button>
                <Button size="sm" variant="outline" onClick={() => void mark(o.id, "paid")}>
                  Paid
                </Button>
                <Button size="sm" variant="outline" onClick={() => void mark(o.id, "done")}>
                  Done
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
      {!isPending && (orders ?? []).length === 0 ? (
        <p className="text-sm text-muted-foreground">No orders yet.</p>
      ) : null}
    </div>
  );
}

/* -------------------------------- Dashboard -------------------------------- */

/* --------------------------------- Posters ---------------------------------- */

function PosterRow({ poster }: { poster: Poster }) {
  const qc = useQueryClient();
  const image = useStoreImage("product-images", poster.image_url);
  const invalidate = () => void qc.invalidateQueries({ queryKey: ["posters"] });

  return (
    <div className="flex flex-wrap items-center gap-4 border border-border p-4">
      {image ? (
        <img src={image} alt={poster.title} className="size-16 object-cover" />
      ) : (
        <div className="flex size-16 items-center justify-center bg-secondary">
          <Megaphone className="size-5 text-muted-foreground" />
        </div>
      )}
      <div className="min-w-40 flex-1">
        <p className="text-lg uppercase">{poster.title}</p>
        {poster.message ? (
          <p className="text-xs text-muted-foreground">{poster.message}</p>
        ) : null}
        <p className="label-tag mt-1 text-[10px] text-muted-foreground">
          {poster.is_active ? "Posted — showing on the website" : "Not posted — hidden"}
        </p>
      </div>
      <label className="flex items-center gap-2 text-xs">
        <Switch
          checked={poster.is_active}
          onCheckedChange={async (v) => {
            try {
              await updatePoster(poster.id, { is_active: v });
              invalidate();
            } catch (err) {
              toast.error(err instanceof Error ? err.message : "Could not update");
            }
          }}
        />
        Post it
      </label>
      <Button
        size="sm"
        variant="destructive"
        onClick={async () => {
          try {
            await deletePoster(poster.id);
            toast.success("Poster deleted");
            invalidate();
          } catch (err) {
            toast.error(err instanceof Error ? err.message : "Could not delete");
          }
        }}
      >
        <Trash2 className="size-3.5" /> Delete
      </Button>
    </div>
  );
}

function PostersTab() {
  const qc = useQueryClient();
  const { data: posters } = useQuery({ queryKey: ["posters", "all"], queryFn: fetchAllPosters });
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [postNow, setPostNow] = useState(true);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const path = file ? await uploadFile("product-images", file) : null;
      await createPoster({
        title,
        message: message || null,
        image_url: path,
        link_url: linkUrl || null,
        is_active: postNow,
      });
      toast.success(postNow ? "Poster posted" : "Poster saved (not posted yet)");
      setTitle("");
      setMessage("");
      setLinkUrl("");
      setFile(null);
      void qc.invalidateQueries({ queryKey: ["posters"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save poster");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <form onSubmit={submit} className="space-y-4 border border-border bg-card p-5">
        <h2 className="text-2xl uppercase">Write a promotion poster</h2>
        <p className="text-xs text-muted-foreground">
          Posters only appear on the website once you switch “Post it” on.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <Label className="label-tag">Poster title</Label>
            <Input required value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label className="label-tag">Link (optional)</Label>
            <Input value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} />
          </div>
        </div>
        <div className="space-y-1">
          <Label className="label-tag">Poster message</Label>
          <Textarea rows={3} value={message} onChange={(e) => setMessage(e.target.value)} />
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <label className="inline-flex cursor-pointer items-center gap-2 border border-border px-3 py-2 text-xs">
            <Upload className="size-4" />
            {file ? file.name : "Poster image"}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </label>
          <label className="flex items-center gap-2 text-xs">
            <Switch checked={postNow} onCheckedChange={setPostNow} />
            Post it now
          </label>
        </div>
        <Button type="submit" disabled={busy} className="bg-lime text-lime-foreground hover:bg-lime/90">
          {busy ? "Saving…" : "Save poster"}
        </Button>
      </form>

      <div className="space-y-3">
        {(posters ?? []).map((poster) => (
          <PosterRow key={poster.id} poster={poster} />
        ))}
        {posters && !posters.length ? (
          <p className="text-sm text-muted-foreground">No posters yet.</p>
        ) : null}
      </div>
    </div>
  );
}

function Dashboard() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data: isAdmin, isPending } = useIsAdmin();

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  if (isPending) {
    return <p className="p-10 text-sm text-muted-foreground">Checking access…</p>;
  }

  if (!isAdmin) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
        <h1 className="text-3xl uppercase">Access denied</h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          This dashboard is restricted to the brand owner account.
        </p>
        <Button onClick={() => void signOut()} variant="outline">
          Sign out
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-ink text-ink-foreground">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-5">
          <div>
            <p className="display-xl text-2xl">Owner dashboard</p>
            <p className="text-xs text-ink-foreground/60">Intellectual Mindset Clothing</p>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/" className="label-tag text-ink-foreground/70 hover:text-lime">
              View site
            </Link>
            <Button size="sm" variant="outline" onClick={() => void signOut()}>
              <LogOut className="size-3.5" /> Sign out
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-8">
        <Tabs defaultValue="products">
          <TabsList className="flex-wrap">
            <TabsTrigger value="products">Products & prices</TabsTrigger>
            <TabsTrigger value="categories">Categories</TabsTrigger>
            <TabsTrigger value="orders">Orders</TabsTrigger>
            <TabsTrigger value="posters">Promotion posters</TabsTrigger>
            <TabsTrigger value="documents">PDF documents</TabsTrigger>
            <TabsTrigger value="settings">Website content</TabsTrigger>
            <TabsTrigger value="assistant">Chat assistant</TabsTrigger>

          </TabsList>
          <TabsContent value="products" className="mt-6">
            <ProductsTab />
          </TabsContent>
          <TabsContent value="categories" className="mt-6">
            <CategoriesTab />
          </TabsContent>
          <TabsContent value="orders" className="mt-6">
            <OrdersTab />
          </TabsContent>
          <TabsContent value="posters" className="mt-6">
            <PostersTab />
          </TabsContent>
          <TabsContent value="documents" className="mt-6">
            <DocumentsTab />
          </TabsContent>
          <TabsContent value="assistant" className="mt-6">
            <AssistantTab />
          </TabsContent>
          <TabsContent value="settings" className="mt-6">
            <SettingsTab />

          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
