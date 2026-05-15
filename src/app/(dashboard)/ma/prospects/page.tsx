"use client";
import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function RedirectInner() {
  const router = useRouter();
  const params = useSearchParams();
  useEffect(() => {
    const qs = params.toString();
    router.replace(`/ma/leads${qs ? `?${qs}` : ""}`);
  }, []);
  return null;
}

export default function ProspectsRedirect() {
  return <Suspense><RedirectInner /></Suspense>;
}
