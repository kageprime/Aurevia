import { Link } from 'react-router-dom';

const termsSections = [
  {
    title: 'Use of this website',
    body: 'By using this site, you agree to use it lawfully and not to interfere with the platform, services, or other users.',
  },
  {
    title: 'Orders and availability',
    body: 'All orders are subject to acceptance and stock availability. We reserve the right to cancel or limit orders where necessary.',
  },
  {
    title: 'Pricing and payments',
    body: 'Prices are shown in the displayed currency and may change without prior notice. Payment must be confirmed before dispatch.',
  },
  {
    title: 'Shipping and delivery',
    body: 'Delivery times are estimates and may vary due to courier operations, high demand periods, or conditions outside our control.',
  },
  {
    title: 'Returns and support',
    body: 'If your order has an issue, contact support within the stated return window so we can review and assist based on policy eligibility.',
  },
  {
    title: 'Changes to these terms',
    body: 'We may update these terms from time to time. Continued use of the site after updates means you accept the revised terms.',
  },
] as const;

export function TermsOfServicePage() {
  return (
    <section className="relative overflow-hidden bg-[#F6F6F2] z-[70] pt-12 lg:pt-14 pb-20 px-6 lg:px-12 min-h-[70vh]">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-24 right-0 h-72 w-72 rounded-full bg-[rgba(255,45,143,0.08)] blur-3xl" />
        <div className="absolute bottom-0 left-8 h-64 w-64 rounded-full bg-[rgba(11,11,13,0.05)] blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-5xl space-y-8">
        <div className="max-w-3xl">
          <p className="text-xs uppercase tracking-[0.28em] text-[#6E6E73] mb-3">Aurevia legal</p>
          <h1 className="text-3xl lg:text-4xl font-bold leading-tight" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            Terms of Service
          </h1>
          <p className="mt-4 text-sm text-[#6E6E73] max-w-2xl">
            Effective date: March 29, 2026. These terms define the rules that apply when you browse, order, or use our services.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {termsSections.map((section) => (
            <article
              key={section.title}
              className="relative overflow-hidden border border-[#0B0B0D]/10 bg-white p-5 shadow-[0_20px_60px_rgba(11,11,13,0.06)]"
            >
              <div className="absolute inset-x-0 top-0 h-1 accent-bg" />
              <h2 className="text-lg font-bold mt-2" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                {section.title}
              </h2>
              <p className="mt-3 text-sm leading-6 text-[#6E6E73]">{section.body}</p>
            </article>
          ))}
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            to="/privacy-policy"
            className="border border-[#0B0B0D]/10 bg-white px-4 py-2 text-sm font-medium text-[#0B0B0D] transition-colors hover:border-[#0B0B0D]"
          >
            Read Privacy Policy
          </Link>
          <Link
            to="/help/contact"
            className="border border-[#0B0B0D]/10 bg-white px-4 py-2 text-sm font-medium text-[#0B0B0D] transition-colors hover:border-[#0B0B0D]"
          >
            Contact Support
          </Link>
        </div>
      </div>
    </section>
  );
}
