"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ProspectNewRedirect() {
  const router = useRouter();
  useEffect(() => { router.replace("/ma/leads/new"); }, []);
  return null;
}
