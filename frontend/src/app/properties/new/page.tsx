"use client";

import { useRouter } from "next/navigation";

import { ManagementRoute } from "@/auth/management-route";
import { PropertyForm } from "@/components/business/property-form";

export default function NewPropertyPage() {
  const router = useRouter();
  return (
    <ManagementRoute>
      <main className="page-stack narrow-page">
        <section className="panel">
          <h1>物件登録</h1>
          <PropertyForm
            onSaved={(property) => router.push(`/properties/${property.id}`)}
          />
        </section>
      </main>
    </ManagementRoute>
  );
}
