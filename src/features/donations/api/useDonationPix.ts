"use client";

import { useMutation } from "@tanstack/react-query";
import { createDonationPix } from "@/features/donations/api/donations-api";

export function useCreateDonationPixMutation() {
  return useMutation({
    mutationFn: (amountCents: number) => createDonationPix(amountCents),
  });
}
