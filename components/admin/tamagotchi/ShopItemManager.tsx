"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  deleteShopItemAction,
  upsertShopItemAction,
} from "@/app/actions/admin-tamagotchi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ImageUploadField } from "@/components/admin/tamagotchi/ImageUploadField";
import type { ShopItem } from "@/types/database";

interface ShopItemManagerProps {
  items: ShopItem[];
}

const emptyForm = {
  id: "",
  name: "",
  type: "head" as ShopItem["type"],
  price: 0,
  imageUrl: "",
  zIndex: 10,
};

export function ShopItemManager({ items }: ShopItemManagerProps) {
  const router = useRouter();
  const [form, setForm] = useState(emptyForm);
  const [isPending, startTransition] = useTransition();

  function loadItem(item: ShopItem) {
    setForm({
      id: item.id,
      name: item.name,
      type: item.type,
      price: item.price,
      imageUrl: item.image_url,
      zIndex: item.z_index,
    });
  }

  function resetForm() {
    setForm(emptyForm);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!form.imageUrl) {
      toast.error("Upload an item sprite before saving");
      return;
    }

    startTransition(async () => {
      try {
        await upsertShopItemAction({
          id: form.id || undefined,
          name: form.name,
          type: form.type,
          price: form.price,
          imageUrl: form.imageUrl,
          zIndex: form.zIndex,
        });
        toast.success(form.id ? "Item updated" : "Item created");
        resetForm();
        router.refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Save failed");
      }
    });
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      try {
        await deleteShopItemAction(id);
        toast.success("Item deleted");
        router.refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Delete failed");
      }
    });
  }

  return (
    <section className="rounded-xl border border-white/10 bg-[var(--card)] p-5">
      <h2 className="mb-4 text-lg font-semibold">Shop Item Manager</h2>

      <form onSubmit={handleSubmit} className="mb-6 grid gap-3 sm:grid-cols-2">
        <Input
          placeholder="Name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          required
        />
        <select
          className="h-11 rounded-xl border border-white/10 bg-city-navy-light px-3 text-sm text-white"
          value={form.type}
          onChange={(e) =>
            setForm({ ...form, type: e.target.value as ShopItem["type"] })
          }
        >
          <option value="food">food</option>
          <option value="head">head</option>
          <option value="accessory">accessory</option>
          <option value="background">background</option>
        </select>
        <Input
          type="number"
          placeholder="Price"
          value={form.price}
          onChange={(e) =>
            setForm({ ...form, price: Number(e.target.value) })
          }
          required
        />
        <Input
          type="number"
          placeholder="Z-index"
          value={form.zIndex}
          onChange={(e) =>
            setForm({ ...form, zIndex: Number(e.target.value) })
          }
          required
        />
        <ImageUploadField
          className="sm:col-span-2"
          label="Item sprite"
          value={form.imageUrl}
          onChange={(imageUrl) => setForm({ ...form, imageUrl })}
        />
        <div className="flex gap-2 sm:col-span-2">
          <Button type="submit" disabled={isPending || !form.imageUrl}>
            {form.id ? "Update Item" : "Add Item"}
          </Button>
          {form.id && (
            <Button type="button" variant="ghost" onClick={resetForm}>
              Cancel edit
            </Button>
          )}
        </div>
      </form>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-white/10 text-white/50">
              <th className="py-2 pr-4">Preview</th>
              <th className="py-2 pr-4">Name</th>
              <th className="py-2 pr-4">Type</th>
              <th className="py-2 pr-4">Price</th>
              <th className="py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-b border-white/5">
                <td className="py-2 pr-4">
                  <div className="relative h-10 w-10">
                    <Image
                      src={item.image_url}
                      alt={item.name}
                      fill
                      unoptimized
                      className="object-contain"
                    />
                  </div>
                </td>
                <td className="py-2 pr-4 font-medium">{item.name}</td>
                <td className="py-2 pr-4 text-white/60">{item.type}</td>
                <td className="py-2 pr-4 text-city-orange">{item.price}</td>
                <td className="py-2">
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => loadItem(item)}>
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      disabled={isPending}
                      onClick={() => handleDelete(item.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
