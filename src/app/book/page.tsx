import BookingReview from "@/components/BookingReview";

export default async function BookPage({ searchParams }: { searchParams: Promise<{ checkIn?: string; checkOut?: string; guests?: string }> }) {
  const params = await searchParams;
  return <BookingReview checkIn={params.checkIn ?? ""} checkOut={params.checkOut ?? ""} guests={Number(params.guests ?? 2)} />;
}
