"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../../lib/supabase";

const categories = [
  {
    value: "medicines",
    label: "💊 الأدوية",
  },
  {
    value: "skin-care",
    label: "🧴 العناية بالبشرة",
  },
  {
    value: "kids",
    label: "🍼 الأطفال",
  },
  {
    value: "medical-devices",
    label: "🩺 الأجهزة الطبية",
  },
];

export default function AddProductPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [allowed, setAllowed] = useState(false);
  const [saving, setSaving] = useState(false);

  const [nameAr, setNameAr] = useState("");
  const [nameEn, setNameEn] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [icon, setIcon] = useState("💊");

  const [category, setCategory] =
    useState("medicines");

  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState("");

  useEffect(() => {
    checkAdmin();
  }, []);

  async function checkAdmin() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setAllowed(false);
        setLoading(false);
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();

      if (!profile || profile.role !== "admin") {
        setAllowed(false);
        setLoading(false);
        return;
      }

      setAllowed(true);
    } catch (error) {
      console.error(
        "CHECK ADMIN ERROR:",
        error
      );
    } finally {
      setLoading(false);
    }
  }

  function handleImage(
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = e.target.files?.[0];

    if (!file) {
      return;
    }

    setImage(file);

    setPreview(
      URL.createObjectURL(file)
    );
  }

  async function addProduct() {
    if (saving) {
      return;
    }

    if (!nameAr.trim()) {
      alert(
        "اكتب اسم المنتج بالعربي"
      );
      return;
    }

    if (!nameEn.trim()) {
      alert(
        "اكتب اسم المنتج بالإنجليزي"
      );
      return;
    }

    if (!category) {
      alert(
        "اختر قسم المنتج"
      );
      return;
    }

    if (!price || Number(price) < 0) {
      alert(
        "اكتب سعر صحيح"
      );
      return;
    }

    if (!stock || Number(stock) < 0) {
      alert(
        "اكتب كمية صحيحة"
      );
      return;
    }

    setSaving(true);

    try {
      let imageUrl: string | null = null;

      if (image) {
        const ext =
          image.name
            .split(".")
            .pop() || "webp";

        const fileName = `${Date.now()}.${ext}`;

        const {
          error: uploadError,
        } = await supabase.storage
          .from("products")
          .upload(
            fileName,
            image
          );

        if (uploadError) {
          alert(
            uploadError.message
          );
          return;
        }

        const {
          data,
        } = supabase.storage
          .from("products")
          .getPublicUrl(
            fileName
          );

        imageUrl =
          data.publicUrl;
      }

      const {
        error,
      } = await supabase
        .from("products")
        .insert({
          name_ar:
            nameAr.trim(),

          name_en:
            nameEn.trim(),

          description:
            description.trim() ||
            null,

          price:
            Number(price),

          stock:
            Number(stock),

          icon:
            icon.trim() ||
            "💊",

          image_url:
            imageUrl,

          category:
            category,
        });

      if (error) {
        alert(
          error.message
        );
        return;
      }

      alert(
        "تم إضافة المنتج بنجاح ✅"
      );

      router.push(
        "/admin/products"
      );

      router.refresh();
    } catch (error) {
      console.error(
        "ADD PRODUCT ERROR:",
        error
      );

      alert(
        "حدث خطأ غير متوقع أثناء إضافة المنتج."
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        جاري التحقق...
      </main>
    );
  }

  if (!allowed) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <h1 className="text-3xl font-bold text-red-600">
          ممنوع الدخول 🚫
        </h1>
      </main>
    );
  }

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-gray-50 p-4 sm:p-6"
    >
      <div className="mx-auto max-w-4xl rounded-2xl bg-white p-5 shadow sm:p-8">

        <h1 className="mb-8 text-2xl font-bold text-green-700 sm:text-3xl">
          ➕ إضافة منتج جديد
        </h1>

        <div className="grid gap-5 md:grid-cols-2">

          {/* اسم المنتج عربي */}

          <div>
            <label className="mb-2 block font-bold text-gray-700">
              اسم المنتج بالعربي
            </label>

            <input
              value={nameAr}
              onChange={(e) =>
                setNameAr(
                  e.target.value
                )
              }
              placeholder="مثال: بانادول"
              className="w-full rounded-xl border p-3 text-gray-900 placeholder-gray-400 outline-none focus:border-green-600"
            />
          </div>

          {/* اسم المنتج إنجليزي */}

          <div>
            <label className="mb-2 block font-bold text-gray-700">
              اسم المنتج بالإنجليزي
            </label>

            <input
              value={nameEn}
              onChange={(e) =>
                setNameEn(
                  e.target.value
                )
              }
              placeholder="Example: Panadol"
              className="w-full rounded-xl border p-3 text-gray-900 placeholder-gray-400 outline-none focus:border-green-600"
            />
          </div>

          {/* القسم */}

          <div>
            <label className="mb-2 block font-bold text-gray-700">
              قسم المنتج
            </label>

            <select
              value={category}
              onChange={(e) =>
                setCategory(
                  e.target.value
                )
              }
              className="w-full rounded-xl border bg-white p-3 text-gray-900 outline-none focus:border-green-600"
            >
              {categories.map(
                (item) => (
                  <option
                    key={
                      item.value
                    }
                    value={
                      item.value
                    }
                  >
                    {item.label}
                  </option>
                )
              )}
            </select>
          </div>

          {/* الوصف */}

          <div className="md:col-span-2">
            <label className="mb-2 block font-bold text-gray-700">
              وصف المنتج
            </label>

            <textarea
              value={
                description
              }
              onChange={(e) =>
                setDescription(
                  e.target.value
                )
              }
              placeholder="اكتب وصف المنتج"
              className="w-full rounded-xl border p-3 text-gray-900 placeholder-gray-400 outline-none focus:border-green-600"
              rows={4}
            />
          </div>

          {/* السعر */}

          <div>
            <label className="mb-2 block font-bold text-gray-700">
              السعر
            </label>

            <input
              type="number"
              min="0"
              value={price}
              onChange={(e) =>
                setPrice(
                  e.target.value
                )
              }
              placeholder="100"
              className="w-full rounded-xl border p-3 text-gray-900 outline-none focus:border-green-600"
            />
          </div>

          {/* الكمية */}

          <div>
            <label className="mb-2 block font-bold text-gray-700">
              الكمية
            </label>

            <input
              type="number"
              min="0"
              value={stock}
              onChange={(e) =>
                setStock(
                  e.target.value
                )
              }
              placeholder="10"
              className="w-full rounded-xl border p-3 text-gray-900 outline-none focus:border-green-600"
            />
          </div>

          {/* الأيقونة */}

          <div>
            <label className="mb-2 block font-bold text-gray-700">
              أيقونة المنتج
            </label>

            <input
              value={icon}
              onChange={(e) =>
                setIcon(
                  e.target.value
                )
              }
              className="w-full rounded-xl border p-3 text-gray-900 outline-none focus:border-green-600"
            />
          </div>

          {/* الصورة */}

          <div>
            <label className="mb-2 block font-bold text-gray-700">
              صورة المنتج
            </label>

            <input
              type="file"
              accept="image/*"
              onChange={
                handleImage
              }
              className="w-full rounded-xl border p-3 text-gray-900"
            />
          </div>
        </div>

        {/* معاينة الصورة */}

        {preview && (
          <div className="mt-6">
            <p className="mb-2 font-bold text-gray-700">
              معاينة الصورة
            </p>

            <img
              src={preview}
              alt="preview"
              className="h-40 w-full rounded-xl object-contain bg-gray-50 sm:w-64"
            />
          </div>
        )}

        {/* زر الإضافة */}

        <button
          onClick={
            addProduct
          }
          disabled={saving}
          className="mt-8 w-full rounded-xl bg-green-600 py-4 font-bold text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving
            ? "جاري الإضافة..."
            : "➕ إضافة المنتج"}
        </button>
      </div>
    </main>
  );
}