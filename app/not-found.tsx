export default function NotFound() {
  return (
    <main
      dir="rtl"
      className="flex min-h-screen items-center justify-center bg-gray-50 px-6"
    >
      <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-lg">
        <div className="text-7xl">🔎</div>

        <h1 className="mt-5 text-3xl font-bold text-green-700">
          الصفحة غير موجودة
        </h1>

        <p className="mt-3 text-gray-500">
          عذرًا، الصفحة التي تبحث عنها غير موجودة.
        </p>

        <a
          href="/"
          className="mt-7 inline-block rounded-xl bg-green-600 px-6 py-3 font-bold text-white hover:bg-green-700"
        >
          🏠 العودة للصفحة الرئيسية
        </a>
      </div>
    </main>
  );
}