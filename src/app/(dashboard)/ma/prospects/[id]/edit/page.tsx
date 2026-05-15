"use client";
import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

export default function ProspectEditRedirect() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  useEffect(() => { router.replace(`/ma/leads/${id}/edit`); }, [id]);
  return null;
}
