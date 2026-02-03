import { redirect } from 'next/navigation';

export default function PlatformTemplateDetailRedirect({ params }: { params: { id: string } }) {
    redirect(`/admin/templates/${params.id}`);
}
