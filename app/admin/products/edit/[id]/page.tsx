"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "../../../../../lib/supabase";

type Product = {
  id: number;
  name_ar: string;
  name_en: string | null;
  description: string | null;
  price: number;
  stock: number;
  icon: string | null;
  image_url: string | null;
  created_at: string;
};

export default function EditProductPage() {
  const params = useParams();
  const router = useRouter();

  const productId = Number(params.id);

  const [product, setProduct] = useState<Product | null>(null);

  const [loading, setLoading] = useState(true);
  const [allowed, setAllowed] = useState(false);
  const [saving, setSaving] = useState(false);

  const [nameAr, setNameAr] = useState("");
  const [nameEn, setNameEn] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [icon, setIcon] = useState("💊");

  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState("");

  // =====================================================
  // التحقق من الأدمن
  // =====================================================

  useEffect(() => {
    checkAdmin();

    return () => {
      if (preview) {
        URL.revokeObjectURL(preview);
      }
    };
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

      const {
        data: profile,
        error: profileError,
      } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();

      if (profileError) {
        console.error(
          "PROFILE ERROR:",
          profileError
        );

        setAllowed(false);
        setLoading(false);
        return;
      }

      if (!profile || profile.role !== "admin") {
        setAllowed(false);
        setLoading(false);
        return;
      }

      setAllowed(true);

      await loadProduct();
    } catch (error) {
      console.error(
        "CHECK ADMIN ERROR:",
        error
      );

      setAllowed(false);
    } finally {
      setLoading(false);
    }
  }

  // =====================================================
  // تحميل المنتج
  // =====================================================

  async function loadProduct() {
    if (!productId || Number.isNaN(productId)) {
      alert("رقم المنتج غير صحيح.");
      router.push("/admin/products");
      return;
    }

    const {
      data,
      error,
    } = await supabase
      .from("products")
      .select("*")
      .eq("id", productId)
      .maybeSingle();

    if (error) {
      console.error(
        "LOAD PRODUCT ERROR:",
        error
      );

      alert(
        "حدث خطأ أثناء تحميل المنتج:\n" +
          error.message
      );

      router.push("/admin/products");
      return;
    }

    if (!data) {
      alert("المنتج غير موجود.");
      router.push("/admin/products");
      return;
    }

    const loadedProduct =
      data as Product;

    setProduct(loadedProduct);

    setNameAr(
      loadedProduct.name_ar || ""
    );

    setNameEn(
      loadedProduct.name_en || ""
    );

    setDescription(
      loadedProduct.description || ""
    );

    setPrice(
      String(loadedProduct.price)
    );

    setStock(
      String(loadedProduct.stock)
    );

    setIcon(
      loadedProduct.icon || "💊"
    );

    setPreview(
      loadedProduct.image_url || ""
    );
  }

  // =====================================================
  // اختيار صورة جديدة
  // =====================================================

  function handleImage(
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = e.target.files?.[0];

    if (!file) return;

    // التأكد أن الملف صورة
    if (!file.type.startsWith("image/")) {
      alert("من فضلك اختر صورة صحيحة.");
      return;
    }

    // حجم الصورة 5 ميجا كحد أقصى
    if (file.size > 5 * 1024 * 1024) {
      alert(
        "حجم الصورة يجب ألا يتجاوز 5 ميجابايت."
      );

      return;
    }

    // إزالة المعاينة القديمة لو كانت مؤقتة
    if (
      preview &&
      preview.startsWith("blob:")
    ) {
      URL.revokeObjectURL(preview);
    }

    setImage(file);

    const imagePreview =
      URL.createObjectURL(file);

    setPreview(imagePreview);
  }

  // =====================================================
  // حذف الصورة الجديدة المختارة
  // =====================================================

  function removeSelectedImage() {
    if (
      preview &&
      preview.startsWith("blob:")
    ) {
      URL.revokeObjectURL(preview);
    }

    setImage(null);

    setPreview(
      product?.image_url || ""
    );
  }

  // =====================================================
  // حفظ المنتج
  // =====================================================

  async function saveProduct() {
    if (saving) return;

    // =====================================================
    // التحقق من البيانات
    // =====================================================

    if (!nameAr.trim()) {
      alert(
        "اكتب اسم المنتج بالعربي."
      );

      return;
    }

    if (!nameEn.trim()) {
      alert(
        "اكتب اسم المنتج بالإنجليزي."
      );

      return;
    }

    if (
      price === "" ||
      Number(price) < 0
    ) {
      alert("اكتب سعر صحيح.");

      return;
    }

    if (
      stock === "" ||
      Number(stock) < 0
    ) {
      alert("اكتب كمية صحيحة.");

      return;
    }

    if (
      !Number.isFinite(Number(price))
    ) {
      alert("السعر غير صحيح.");

      return;
    }

    if (
      !Number.isInteger(Number(stock))
    ) {
      alert(
        "الكمية يجب أن تكون رقمًا صحيحًا."
      );

      return;
    }

    setSaving(true);

    try {
      // =====================================================
      // الصورة الحالية
      // =====================================================

      let imageUrl =
        product?.image_url || null;

      // =====================================================
      // لو اختار صورة جديدة
      // =====================================================

      if (image) {
        const extension =
          image.name
            .split(".")
            .pop()
            ?.toLowerCase() || "jpg";

        const fileName =
          `${productId}-${Date.now()}.${extension}`;

        const {
          error: uploadError,
        } = await supabase.storage
          .from("products")
          .upload(
            fileName,
            image,
            {
              cacheControl: "3600",
              upsert: false,
            }
          );

        if (uploadError) {
          console.error(
            "IMAGE UPLOAD ERROR:",
            uploadError
          );

          alert(
            "حدث خطأ أثناء رفع الصورة:\n" +
              uploadError.message
          );

          return;
        }

        const {
          data: publicUrlData,
        } = supabase.storage
          .from("products")
          .getPublicUrl(
            fileName
          );

        imageUrl =
          publicUrlData.publicUrl;
      }

      // =====================================================
      // تحديث المنتج
      // =====================================================

      const productData = {
        name_ar:
          nameAr.trim(),

        name_en:
          nameEn.trim(),

        description:
          description.trim() || null,

        price:
          Number(price),

        stock:
          Number(stock),

        icon:
          icon.trim() || "💊",

        image_url:
          imageUrl,
      };

      const {
        error: updateError,
      } = await supabase
        .from("products")
        .update(productData)
        .eq(
          "id",
          productId
        );

      if (updateError) {
        console.error(
          "UPDATE PRODUCT ERROR:",
          updateError
        );

        alert(
          "حدث خطأ أثناء تعديل المنتج:\n" +
            updateError.message
        );

        return;
      }

      alert(
        "تم تعديل المنتج بنجاح ✅"
      );

      router.push(
        "/admin/products"
      );

      router.refresh();
    } catch (error) {
      console.error(
        "SAVE PRODUCT ERROR:",
        error
      );

      alert(
        "حدث خطأ أثناء حفظ المنتج."
      );
    } finally {
      setSaving(false);
    }
  }

  // =====================================================
  // Loading
  // =====================================================

  if (loading) {
    return (
      <main
        dir="rtl"
        className="flex min-h-screen items-center justify-center bg-gray-50"
      >
        <div className="text-xl font-bold text-green-700">
          جاري تحميل المنتج...
        </div>
      </main>
    );
  }

  // =====================================================
  // منع الدخول
  // =====================================================

  if (!allowed) {
    return (
      <main
        dir="rtl"
        className="flex min-h-screen items-center justify-center bg-gray-50 p-6"
      >
        <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-lg">
          <div className="text-6xl">
            🚫
          </div>

          <h1 className="mt-5 text-2xl font-bold text-red-600">
            ممنوع الدخول
          </h1>

          <p className="mt-3 text-gray-600">
            ليس لديك صلاحية لتعديل المنتجات.
          </p>

          <a
            href="/"
            className="mt-6 inline-block rounded-xl bg-green-600 px-6 py-3 font-bold text-white hover:bg-green-700"
          >
            العودة للموقع
          </a>
        </div>
      </main>
    );
  }

  // =====================================================
  // المنتج غير موجود
  // =====================================================

  if (!product) {
    return (
      <main
        dir="rtl"
        className="flex min-h-screen items-center justify-center bg-gray-50"
      >
        <div className="text-xl font-bold text-gray-700">
          المنتج غير موجود.
        </div>
      </main>
    );
  }

  // =====================================================
  // الصفحة
  // =====================================================

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-gray-50"
    >
      {/* =====================================================
          Header
      ===================================================== */}

      <header className="bg-white shadow-sm">
        <div className="mx-auto flex max-w-4xl flex-col gap-4 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-green-700">
              تعديل المنتج
            </h1>

            <p className="text-sm text-gray-500">
              صيدلية الشفاء
            </p>
          </div>

          <a
            href="/admin/products"
            className="rounded-lg border border-green-600 px-5 py-2 text-center font-bold text-green-700 hover:bg-green-50"
          >
            ← المنتجات الموجودة
          </a>
        </div>
      </header>

      {/* =====================================================
          Form
      ===================================================== */}

      <section className="mx-auto max-w-4xl px-6 py-10">
        <div className="rounded-2xl bg-white p-6 shadow-sm sm:p-8">

          {/* =====================================================
              عنوان المنتج
          ===================================================== */}

          <div className="mb-8">
            <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center">

              {/* صورة المنتج */}

              <div className="flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-green-100 bg-green-50">
                {preview ? (
                  <img
                    src={preview}
                    alt={
                      nameAr ||
                      "صورة المنتج"
                    }
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-5xl">
                    {icon || "💊"}
                  </span>
                )}
              </div>

              <div>
                <h2 className="text-3xl font-bold text-gray-800">
                  ✏️ تعديل:{" "}
                  {product.name_ar}
                </h2>

                {product.name_en && (
                  <p className="mt-1 text-gray-500">
                    {product.name_en}
                  </p>
                )}

                <p className="mt-2 text-sm text-gray-500">
                  رقم المنتج:{" "}
                  {product.id}
                </p>
              </div>
            </div>
          </div>

          {/* =====================================================
              البيانات
          ===================================================== */}

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

            {/* الاسم العربي */}

            <div>
              <label className="mb-2 block font-bold text-gray-700">
                اسم المنتج بالعربي
              </label>

              <input
                type="text"
                value={nameAr}
                onChange={(e) =>
                  setNameAr(
                    e.target.value
                  )
                }
                placeholder="مثال: بانادول"
                className="w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 outline-none focus:border-green-600"
              />
            </div>

            {/* الاسم الإنجليزي */}

            <div>
              <label className="mb-2 block font-bold text-gray-700">
                اسم المنتج بالإنجليزي
              </label>

              <input
                type="text"
                value={nameEn}
                onChange={(e) =>
                  setNameEn(
                    e.target.value
                  )
                }
                placeholder="Example: Panadol"
                className="w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 outline-none focus:border-green-600"
              />
            </div>

            {/* الوصف */}

            <div className="md:col-span-2">
              <label className="mb-2 block font-bold text-gray-700">
                وصف المنتج
              </label>

              <textarea
                value={description}
                onChange={(e) =>
                  setDescription(
                    e.target.value
                  )
                }
                placeholder="اكتب وصف المنتج..."
                rows={5}
                className="w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 outline-none focus:border-green-600"
              />
            </div>

            {/* السعر */}

            <div>
              <label className="mb-2 block font-bold text-gray-700">
                السعر بالجنيه
              </label>

              <input
                type="number"
                min="0"
                step="0.01"
                value={price}
                onChange={(e) =>
                  setPrice(
                    e.target.value
                  )
                }
                placeholder="100"
                className="w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 outline-none focus:border-green-600"
              />
            </div>

            {/* الكمية */}

            <div>
              <label className="mb-2 block font-bold text-gray-700">
                الكمية المتاحة
              </label>

              <input
                type="number"
                min="0"
                step="1"
                value={stock}
                onChange={(e) =>
                  setStock(
                    e.target.value
                  )
                }
                placeholder="10"
                className="w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 outline-none focus:border-green-600"
              />
            </div>

            {/* الأيقونة */}

            <div>
              <label className="mb-2 block font-bold text-gray-700">
                أيقونة المنتج
              </label>

              <input
                type="text"
                value={icon}
                onChange={(e) =>
                  setIcon(
                    e.target.value
                  )
                }
                placeholder="💊"
                className="w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 outline-none focus:border-green-600"
              />

              <p className="mt-2 text-sm text-gray-400">
                تستخدم كبديل في حالة عدم وجود صورة.
              </p>
            </div>

            {/* صورة المنتج */}

            <div>
              <label className="mb-2 block font-bold text-gray-700">
                صورة المنتج
              </label>

              <input
                type="file"
                accept="image/*"
                onChange={handleImage}
                disabled={saving}
                className="w-full rounded-xl border border-gray-300 bg-white p-3 text-gray-900"
              />

              <p className="mt-2 text-sm text-gray-400">
                الحد الأقصى لحجم الصورة 5 ميجابايت.
              </p>
            </div>
          </div>

          {/* =====================================================
              معاينة الصورة
          ===================================================== */}

          {preview && (
            <div className="mt-8 rounded-2xl border border-gray-200 bg-gray-50 p-5">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-bold text-gray-700">
                  🖼️ معاينة الصورة
                </h3>

                {image && (
                  <button
                    type="button"
                    onClick={
                      removeSelectedImage
                    }
                    disabled={saving}
                    className="rounded-lg bg-red-50 px-4 py-2 text-sm font-bold text-red-600 hover:bg-red-100 disabled:opacity-50"
                  >
                    إلغاء الصورة الجديدة
                  </button>
                )}
              </div>

              <div className="flex justify-center">
                <img
                  src={preview}
                  alt={
                    nameAr ||
                    "صورة المنتج"
                  }
                  className="h-56 w-56 rounded-2xl border border-gray-200 bg-white object-contain p-2"
                />
              </div>

              {image && (
                <p className="mt-3 text-center text-sm font-bold text-green-600">
                  ✅ سيتم استخدام الصورة الجديدة عند الحفظ
                </p>
              )}
            </div>
          )}

          {/* =====================================================
              الأزرار
          ===================================================== */}

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">

            <button
              onClick={saveProduct}
              disabled={saving}
              className="rounded-xl bg-green-600 px-8 py-3 font-bold text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving
                ? "⏳ جاري حفظ التعديل..."
                : "💾 حفظ التعديل"}
            </button>

            <button
              onClick={() =>
                router.push(
                  "/admin/products"
                )
              }
              disabled={saving}
              className="rounded-xl border border-gray-300 bg-white px-8 py-3 font-bold text-gray-700 hover:bg-gray-50 disabled:opacity-60"
            >
              إلغاء
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}