import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Summer Quest",
  description: "A family-friendly summer activity tracker for kids."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <style
          dangerouslySetInnerHTML={{
            __html: `
              body { margin: 0; min-height: 100vh; background: #e5f3f0; color: #020617; font-family: Inter, ui-sans-serif, system-ui, "Segoe UI", Arial, sans-serif; }
              main { min-height: 100vh; }
              section { box-sizing: border-box; }
              button, input, select, textarea { font: inherit; }
              button { cursor: pointer; border-radius: 0.375rem; }
              input { box-sizing: border-box; }
              .rounded-lg { border-radius: 0.5rem; }
              .rounded-md { border-radius: 0.375rem; }
              .bg-white { background: #fff; }
              .text-white { color: #fff; }
              .font-bold, .font-semibold, .font-black { font-weight: 700; }
              .shadow-sm { box-shadow: 0 1px 2px rgba(15, 23, 42, 0.08); }
              .border { border-width: 1px; border-style: solid; }
              .grid { display: grid; }
              .flex { display: flex; }
              .items-center { align-items: center; }
              .items-start { align-items: flex-start; }
              .justify-between { justify-content: space-between; }
              .gap-2 { gap: 0.5rem; }
              .gap-3 { gap: 0.75rem; }
              .gap-4 { gap: 1rem; }
              .p-3 { padding: 0.75rem; }
              .p-4 { padding: 1rem; }
              .p-5 { padding: 1.25rem; }
              .px-3 { padding-left: 0.75rem; padding-right: 0.75rem; }
              .px-4 { padding-left: 1rem; padding-right: 1rem; }
              .py-5 { padding-top: 1.25rem; padding-bottom: 1.25rem; }
              .mt-1 { margin-top: 0.25rem; }
              .mt-2 { margin-top: 0.5rem; }
              .mt-3 { margin-top: 0.75rem; }
              .mt-4 { margin-top: 1rem; }
              .mx-auto { margin-left: auto; margin-right: auto; }
              .max-w-3xl { max-width: 48rem; }
              .max-w-6xl { max-width: 72rem; }
              .w-full { width: 100%; }
              .min-h-10 { min-height: 2.5rem; }
              .min-h-11 { min-height: 2.75rem; }
              .min-h-12 { min-height: 3rem; }
              .text-sm { font-size: 0.875rem; line-height: 1.25rem; }
              .text-lg { font-size: 1.125rem; line-height: 1.75rem; }
              .text-xl { font-size: 1.25rem; line-height: 1.75rem; }
              .text-2xl { font-size: 1.5rem; line-height: 2rem; }
              .text-3xl { font-size: 1.875rem; line-height: 2.25rem; }
              .text-5xl { font-size: 3rem; line-height: 1; }
            `,
          }}
        />
        {children}
      </body>
    </html>
  );
}
