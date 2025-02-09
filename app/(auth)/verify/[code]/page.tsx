import { redirect } from 'next/navigation';

export default function VerifyCode({ params }: { params: { code: string } }) {
  redirect(`/verify?token=${params.code}`);
} 