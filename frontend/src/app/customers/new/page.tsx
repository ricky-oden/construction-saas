"use client";

import { useRouter } from "next/navigation";

import { ManagementRoute } from "@/auth/management-route";
import { CustomerForm } from "@/components/business/customer-form";

export default function NewCustomerPage() {
  const router = useRouter();
  return (
    <ManagementRoute>
      <main className="page-stack narrow-page">
        <section className="panel">
          <h1>顧客登録</h1>
          <CustomerForm
            onSaved={(customer) => router.push(`/customers/${customer.id}`)}
          />
        </section>
      </main>
    </ManagementRoute>
  );
}
