import { redirect } from 'next/navigation';

export default function PlatformTemplateBuilderRedirect({ params }: { params: { id: string } }) {
    redirect(`/admin/templates/${params.id}/builder`);
}
