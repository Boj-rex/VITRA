import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Processing Payment & Activating CV Workspace",
  description: "Secure Paystack payment verification and instant quota activation.",
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
    },
  },
};

export default function PricingCallbackLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
