import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Official Receipt & Workspace Activation",
  description: "Official payment receipt and quota activation for your Vitra CV Studio workspace.",
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

export default function PricingReceiptLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
