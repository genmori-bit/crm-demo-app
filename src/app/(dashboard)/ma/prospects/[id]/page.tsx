"use client";
import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

export default function ProspectDetailRedirect() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  useEffect(() => { router.replace(`/ma/leads/${id}`); }, [id]);
  return null;
}
